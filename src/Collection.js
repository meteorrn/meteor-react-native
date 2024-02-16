import Tracker from './Tracker.js';
import EJSON from 'ejson';
import Data from './Data';
import Random from '../lib/Random';
import call from './Call';
import { hasOwn, isPlainObject } from '../lib/utils.js';

/**
 * @private
 * @type {object}
 */
const observers = {};
/**
 * @private
 * @type {object}
 */
const observersByComp = {};
/**
 * Get the list of callbacks for changes on a collection
 * @param {string} type - Type of change happening.
 * @param {string} collection - Collection it has happened on
 * @param {string} newDocument - New value of item in the collection
 */
export function getObservers(type, collection, newDocument) {
  let observersRet = [];
  if (observers[collection]) {
    observers[collection].forEach(({ cursor, callbacks }) => {
      if (callbacks[type]) {
        if (type === 'removed') {
          observersRet.push(callbacks['removed']);
        } else if (
          Data.db[collection].findOne({
            $and: [{ _id: newDocument._id }, cursor._selector],
          })
        ) {
          try {
            observersRet.push(callbacks[type]);
          } catch (e) {
            console.error('Error in observe callback old', e);
          }
        } else {
          // TODO what to do here?
        }
      }
    });
  }
  // Find the observers related to the specific query
  if (observersByComp[collection]) {
    let keys = Object.keys(observersByComp[collection]);
    for (let i = 0; i < keys.length; i++) {
      observersByComp[collection][keys[i]].callbacks.forEach(
        ({ cursor, callback }) => {
          let findRes = Data.db[collection].findOne({
            $and: [{ _id: newDocument?._id }, cursor._selector],
          });
          if (findRes) {
            observersRet.push(callback);
          }
        }
      );
    }
  }
  return observersRet;
}

/** @private */
const _registerObserver = (collection, cursor, callbacks) => {
  observers[collection] = observers[collection] || [];
  observers[collection].push({ cursor, callbacks });
};

/**
 * Represents a Mongo.Cursor, usually returned by Collection.find().
 *
 * @see https://docs.meteor.com/api/collections.html#mongo_cursor
 */
class Cursor {
  /**
   * Usually you don't use this directly, unless you know what you are doing.
   * @constructor
   * @param collection
   * @param docs
   * @param selector
   */
  constructor(collection, docs, selector) {
    this._docs = docs || [];
    this._collection = collection;
    this._selector = selector;
  }

  /**
   * Returns the number of documents that match a query.
   * This method is deprecated since MongoDB 4.0 and will soon be replaced by
   * Collection.countDocuments and Collection.estimatedDocumentCount.
   *
   * @deprecated
   * @returns {number} size of the collection
   */
  count() {
    return this._docs.length;
  }

  /**
   * Return all matching documents as an Array.
   * @returns {object[]}
   */
  fetch() {
    return this._transformedDocs();
  }

  /**
   * Call callback once for each matching document, sequentially and synchronously.
   * @param callback {function}
   *     Function to call. It will be called with three arguments: the document, a 0-based index, and cursor itself.
   */
  forEach(callback) {
    this._transformedDocs().forEach(callback);
  }

  /**
   * Map callback over all matching documents. Returns an Array.
   * @param callback {function} Function to call. It will be called with three arguments:
   *   the document, a 0-based index, and cursor itself.
   * @returns {object[]}
   */
  map(callback) {
    return this._transformedDocs().map(callback);
  }

  /**
   * Applies a transform method on the documents, if given.
   * @private
   * @private
   * @returns {object[]}
   */
  _transformedDocs() {
    return this._collection._transform
      ? this._docs.map(this._collection._transform)
      : this._docs;
  }

  /**
   * Registers an observer for the given callbacks
   * @param callbacks {object}
   * @see https://docs.meteor.com/api/collections.html#Mongo-Cursor-observe
   */
  observe(callbacks) {
    _registerObserver(this._collection._collection.name, this, callbacks);
  }
}

/**
 * List of all local collections, whose names
 * are defined with `null`.
 *
 */
export const localCollections = [];

/**
 * Reference implementation for a Mongo.Collection.
 * Uses Minimongo under the hood.
 * We have forked minimongo into our org, see the link below.
 *
 * @class
 * @see https://docs.meteor.com/api/collections.html
 * @see https://github.com/meteorrn/minimongo-cache
 */
export class Collection {
  /**
   * Constructor for a Collection
   * @param name {string|null}
   *     The name of the collection. If null, creates an unmanaged (unsynchronized) local collection.
   * @param options {object=}
   * @param options.transform {function=}
   *  An optional transformation function.
   *  Documents will be passed through this function before being returned from fetch or findOne,
   *  and before being passed to callbacks of observe, map, forEach, allow, and deny.
   *  Transforms are not applied for the callbacks of observeChanges or to cursors returned from publish functions.
   */
  constructor(name, options = {}) {
    if (name === null) {
      this.localCollection = true;
      name = Random.id();
      localCollections.push(name);
    }

    // XXX: apparently using a name that occurs in Object prototype causes
    // Data.db[name] to return the full MemoryDb implementation from Minimongo
    // instead of a collection.
    // A respective issues has been opened: https://github.com/meteorrn/minimongo-cache
    // Additionally, this is subject to prototype pollution.
    if (name in {}) {
      throw new Error(
        `Object-prototype property ${name} is not a supported Collection name`
      );
    }

    if (!Data.db[name]) Data.db.addCollection(name);

    this._collection = Data.db[name];
    this._name = name;
    this._transform = wrapTransform(options.transform);
  }

  /**
   * Find the documents in a collection that match the selector.
   * If called in useTracker it automatically invokes a new Tracker.Computation
   * // TODO add reactive flag to options to disable reactivity for this call
   * // TODO evaluate if hint: { $natural } can be implemented for backward search
   *
   * @param selector {string|object}
   *     A query describing the documents to find
   * @param options {object=}
   * @param options.sort {object=}
   * @param options.limit {number=}
   * @param options.skip {number=}
   * @param options.fields {object=}
   * @returns {Cursor}
   */
  find(selector, options) {
    let result;
    let docs;

    if (typeof selector == 'string') {
      if (options) {
        docs = this._collection.findOne({ _id: selector }, options);
      } else {
        docs = this._collection.get(selector);
      }

      if (docs) docs = [docs];
    } else {
      docs = this._collection.find(selector, options);
    }
    result = new Cursor(
      this,
      docs,
      typeof selector == 'string' ? { _id: selector } : selector
    );

    // If this is being called within a use tracker
    // make the tracker computation to say if this
    // collection is changed it needs to be re-run
    if (Tracker.active && Tracker.currentComputation) {
      let id = Tracker.currentComputation._id;
      observersByComp[this._name] = observersByComp[this._name] || {};
      if (!observersByComp[this._name][id]) {
        let item = {
          computation: Tracker.currentComputation,
          callbacks: [],
        };
        observersByComp[this._name][id] = item;
      }
      let item = observersByComp[this._name][id];

      item.callbacks.push({
        cursor: result,
        callback: (newVal, old) => {
          if (old && EJSON.equals(newVal, old)) {
            return;
          }

          item.computation.invalidate();
        },
      });

      Tracker.onInvalidate(() => {
        if (observersByComp[this._name][id]) {
          delete observersByComp[this._name][id];
        }
      });
    }

    return result;
  }

  /**
   *
   * @param selector
   * @param options
   * @returns {Cursor}
   */
  findOne(selector, options) {
    let result = this.find(selector, options);

    if (result) {
      result = result.fetch()[0];
    }

    return result;
  }

  /**
   * Inserts a new document into the collection.
   * If this is a collection that exists on the server, then it also
   * calls the respective server side method
   * /collectionName/insert
   * @param item {object} the document to add to the collection
   * @param callback {function=} optional callback, called when complete with error or result
   */
  insert(item, callback = () => {}) {
    let id;

    if ('_id' in item) {
      if (!item._id || typeof item._id != 'string') {
        return callback(
          'Meteor requires document _id fields to be non-empty strings'
        );
      }
      id = item._id;
    } else {
      id = item._id = Random.id();
    }

    if (this._collection.get(id))
      return callback({
        error: 409,
        reason: `Duplicate key _id with value ${id}`,
      });

    this._collection.upsert(item);

    if (!this.localCollection) {
      Data.waitDdpConnected(() => {
        call(`/${this._name}/insert`, item, (err) => {
          if (err) {
            this._collection.del(id);
            return callback(err);
          }

          callback(null, id);
        });
      });
    }
    // Notify relevant observers that the item has been updated with its new value
    let observers = getObservers('added', this._collection.name, item);
    observers.forEach((callback) => {
      try {
        callback(item, undefined);
      } catch (e) {
        console.error('Error in observe callback', e);
      }
    });

    return id;
  }

  /**
   * Update **a single** document by given id.
   * If this is a collection that exists on the server, then it also
   * calls the respective server side method
   * /collectionName/update
   * @param id {string|MongoID.ObjectID} id or ObjectID of the given document
   * @param modifier {object} the modifier, see the minimongo docs for supported modifiers
   * @param options {object=}
   * @param options.localOnly {boolean=} force update call to server, even if this is a local collection
   * @param callback {function=} optional callback, called when complete with error or result
   */
  update(id, modifier, options = {}, callback = () => {}) {
    if (typeof options == 'function') {
      callback = options;
    }
    let old = this._collection.get(id);
    if (!this._collection.get(id))
      return callback({
        error: 409,
        reason: `Item not found in collection ${this._name} with id ${id}`,
      });

    // change mini mongo for optimize UI changes
    // TODO only exec if modifier.$set is an object
    this._collection.upsert({ _id: id, ...modifier.$set });

    if (!this.localCollection || (options && options.localOnly)) {
      Data.waitDdpConnected(() => {
        call(`/${this._name}/update`, { _id: id }, modifier, (err) => {
          if (err) {
            // TODO in such case the _collection's document should be reverted
            // unless we remove the auto-update to the server anyways
            return callback(err);
          }

          callback(null, id);
        });
      });
    }
    let newItem = this._collection.findOne({ _id: id });
    // Notify relevant observers that the item has been updated with its new value
    let observers = getObservers('changed', this._collection.name, newItem);
    observers.forEach((callback) => {
      try {
        callback(newItem, old);
      } catch (e) {
        // TODO make listenable / loggable
        console.error('Error in observe callback', e);
      }
    });
  }

  /**
   * Remove a **single** document by a given id.
   * If it's not a local collection then the respective server
   * collection method endpoint /collectionName/remove is called.
   *
   * @param id {string|MongoID.ObjectID} _id of the document to remove
   * @param callback {function=} optional callback, called when complete with error or result
   */
  remove(id, callback = () => {}) {
    const element = this.findOne(id);

    if (element) {
      this._collection.del(element._id);

      if (!this.localCollection) {
        Data.waitDdpConnected(() => {
          call(`/${this._name}/remove`, { _id: id }, (err, res) => {
            if (err) {
              this._collection.upsert(element);
              return callback(err);
            }
            callback(null, res);
          });
        });
      }

      // Load the observers for removing the element
      let observers = getObservers('removed', this._collection.name, element);
      observers.forEach((callback) => {
        try {
          callback(element);
        } catch (e) {
          // TODO make listenable / loggable
          console.error('Error in observe callback', e);
        }
      });
    } else {
      // TODO wrap message in new Error
      callback(`No document with _id : ${id}`);
    }
  }

  /**
   * Define helpers for documents. This is basically an implementation of
   * `dburles:mongo-collection-helpers`
   * @param helpers {object} dictionary of helper functions that become prototypes of the documents
   * @see https://github.com/dburles/meteor-collection-helpers
   */
  helpers(helpers) {
    let _transform;

    if (this._transform && !this._helpers) _transform = this._transform;

    if (!this._helpers) {
      this._helpers = function Document(doc) {
        return Object.assign(this, doc);
      };
      this._transform = (doc) => {
        if (_transform) {
          doc = _transform(doc);
        }
        return new this._helpers(doc);
      };
    }

    Object.entries(helpers).forEach(([key, helper]) => {
      this._helpers.prototype[key] = helper;
    });
  }
}

//From Meteor core

/**
 * Wrap a transform function to return objects that have the _id field
 * of the untransformed document. This ensures that subsystems such as
 * the observe-sequence package that call `observe` can keep track of
 * the documents identities.
 *
 * - Require that it returns objects
 * - If the return value has an _id field, verify that it matches the
 *   original _id field
 * - If the return value doesn't have an _id field, add it back.
 * @private
 */
function wrapTransform(transform) {
  if (!transform) return null;

  // No need to doubly-wrap transforms.
  if (transform.__wrappedTransform__) return transform;

  var wrapped = function (doc) {
    if (!hasOwn(doc, '_id')) {
      // XXX do we ever have a transform on the oplog's collection? because that
      // collection has no _id.
      throw new Error('can only transform documents with _id');
    }

    var id = doc._id;
    // XXX consider making tracker a weak dependency and checking Package.tracker here
    var transformed = Tracker.nonreactive(function () {
      return transform(doc);
    });

    if (!isPlainObject(transformed)) {
      throw new Error('transform must return object');
    }

    if (hasOwn(transformed, '_id')) {
      if (!EJSON.equals(transformed._id, id)) {
        throw new Error("transformed document can't have different _id");
      }
    } else {
      transformed._id = id;
    }
    return transformed;
  };
  wrapped.__wrappedTransform__ = true;
  return wrapped;
}
