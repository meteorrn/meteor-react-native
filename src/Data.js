import Minimongo from '@meteorrn/minimongo';
import Tracker from './Tracker.js';
import {
  batchedUpdates,
  runAfterInteractions,
} from '../helpers/reactNativeBindings.js';

/**
 * @private
 */
const db = new Minimongo();
db.debug = false;
db.batchedUpdates = batchedUpdates;

/**
 * @private
 */
process.nextTick = setImmediate;

/**
 * @private
 */
const afterInteractions = runAfterInteractions;
global.afterInteractions = afterInteractions;

/**
 * @private
 * @param fn
 */
function runAfterOtherComputations(fn) {
  afterInteractions(() => {
    Tracker.afterFlush(() => {
      fn();
    });
  });
}

/**
 * @namespace Data
 * @type {object}
 * @summary The data layer representation. Returned by {Meteor.getData}
 */
const Data = {
  /**
   * the ws-endpoint url to connect to
   * @privae
   */
  _endpoint: null,
  /**
   * @private
   */
  _options: {},
  /**
   * @summary The DDP implementation we use for this library
   * @type {DDP}
   */
  ddp: null,
  subscriptions: {},
  /**
   * The Minimongo database implementation we use for this library
   * @type {Minimongo}
   */
  db: db,

  /**
   * @private
   */
  calls: [],

  /**
   * Returns the base-url of our connection-endpoint,
   * having /websocket being stripped
   * @returns {string} the connection url
   */
  getUrl() {
    return this._endpoint.substring(0, this._endpoint.indexOf('/websocket'));
  },

  /**
   * Runs a callback, once we have our DDP implementation available
   * @param cb {function}
   */
  waitDdpReady(cb) {
    if (this.ddp) {
      cb();
    } else {
      runAfterOtherComputations(() => {
        this.waitDdpReady(cb);
      });
    }
  },

  /**
   * @private
   */
  _cbs: [],

  /**
   * Listens to various events of change and pipes them into a single callback.
   * The events include
   * - ddp: change
   * - ddp: connected
   * - ddp: disconnected
   * - Accounts: loggingIn
   * - Accounts: loggingOut
   * - DB: change
   * @param cb {function}
   */
  onChange(cb) {
    this.db.on('change', cb);
    this.ddp.on('connected', cb);
    this.ddp.on('disconnected', cb);
    this.on('loggingIn', cb);
    this.on('loggingOut', cb);
    this.on('change', cb);
  },

  /**
   * Stops listening the events from `Data.onChange`.
   * Requires the **exact same callback function** to work properly!
   * @param cb {function}
   */
  offChange(cb) {
    this.db.off('change', cb);
    this.ddp.off('connected', cb);
    this.ddp.off('disconnected', cb);
    this.off('loggingIn', cb);
    this.off('loggingOut', cb);
    this.off('change', cb);
  },

  /**
   * Listens to a single event, available on this layer.
   * @param eventName {string}
   * @param cb {function}
   */
  on(eventName, cb) {
    this._cbs.push({
      eventName: eventName,
      callback: cb,
    });
  },
  /**
   * Stops listening to a single event on this layer.
   * Requires **the exact same function** to work properly!
   * @param eventName {string}
   * @param cb {function}
   */
  off(eventName, cb) {
    this._cbs.splice(
      this._cbs.findIndex(
        (_cb) => _cb.callback == cb && _cb.eventName == eventName
      ),
      1
    );
  },
  /**
   * Run all callbacks that listen on a given event by name.
   * @param eventName {string}
   * @param optionalData {object=}
   */
  notify(eventName, optionalData) {
    // Notifify that changes have been made
    // Put in timeout so it doesn't block main thread
    setTimeout(() => {
      this._cbs.map((cb) => {
        if (cb.eventName == eventName && typeof cb.callback == 'function') {
          cb.callback(optionalData);
        }
      });
    }, 1);
  },
  /**
   * Queues a function to be called one time, once ddp connection
   * is established.
   * @param callback {function}
   */
  waitDdpConnected(callback) {
    if (this.ddp && this.ddp.status == 'connected') {
      callback();
    } else if (this.ddp) {
      this.ddp.once('connected', callback);
    } else {
      setTimeout(() => {
        this.waitDdpConnected(callback);
      }, 10);
    }
  },
};

export default Data;
