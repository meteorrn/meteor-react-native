import { WebSocket } from 'mock-socket';
import Mongo from '../../src/Mongo';
import { endpoint } from '../testHelpers'
import {
  localCollections,
  runObservers,
} from '../../src/Collection';
import { expect } from 'chai';
import Data from '../../src/Data';
import DDP from '../../lib/ddp';
import Random from '../../lib/Random';
import { server } from '../hooks/mockServer';

const Collection = Mongo.Collection;

describe('Collection', function () {

  // for proper collection tests we need the server to be active

  before(function () {
    if (!Data.ddp) {
      Data.ddp = new DDP({
        SocketConstructor: WebSocket,
        endpoint,
        autoConnect: false
      });
      Data.ddp.socket.on('open', () => {
        Data.ddp.socket.emit('message:in', { msg: 'connected' });
      });
      Data.ddp.connect();

      // we simulate similar behaviour as in Meteor.call
      // but without relying on Meteor here
      Data.ddp.socket.on('message:in', (message) => {
        if (!message.id) return;

        const call = Data.calls.find((call) => call.id === message.id);
        if (!call) return;

        if (typeof call.callback === 'function') {
          call.callback(message.error, message.result);
        }
        Data.calls.splice(
          Data.calls.findIndex((call) => call.id === message.id),
          1
        );
      });
    }
  });

  describe('constructor', function () {
    it('is exported via Mongo', () => {
      expect(Mongo.Collection).to.equal(Collection);
    })
    it('creates a new collection and one in Minimongo', function () {
      const name = Random.id(6);
      const c = new Collection(name);
      expect(c._name).to.equal(name);
      expect(c._transform).to.equal(null);
      expect(Data.db.collections[name]).to.equal(c._collection);
    });
    it('creates a local collection and a random counterpart in minimongo', function () {
      const c = new Collection(null);
      expect(c._name).to.not.equal(null);
      expect(c.localCollection).to.equal(true);
      expect(c._transform).to.equal(null);
      expect(Data.db.collections[c._name]).to.equal(c._collection);
    });
    it('creates a collection with transform options', function () {
      let transform = () => null;
      let c;

      c = new Collection(Random.id(), { transform });
      expect(() => c._transform({})).to.throw(
        'can only transform documents with _id'
      );

      // transform returns currently null (as you can see above)
      const _id = Random.id();
      expect(() => c._transform({ _id })).to.throw(
        'transform must return object'
      );

      transform = () => ({ _id: Random.id() });
      c = new Collection(Random.id(), { transform });
      expect(() => c._transform({ _id })).to.throw(
        "transformed document can't have different _id"
      );

      transform = () => ({ foo: 'bar' });
      c = new Collection(Random.id(), { transform });
      expect(c._transform({ _id })).to.deep.equal({ _id, foo: 'bar' });
    });
  });

  describe('insert', function () {
    it('throws on wrong _id value', function (done) {
      const c = new Collection(Random.id());
      c.insert({ _id: () => {} }, (err) => {
        expect(err).to.equal(
          'Meteor requires document _id fields to be non-empty strings'
        );
        done();
      });
    });
    it('inserts docs', function (done) {
      const c = new Collection(Random.id());
      expect(c.find().count()).to.equal(0);

      const methodName = `/${c._name}/insert`;
      server().message((messageStr) => {
        const message = JSON.parse(messageStr);

        if (message.msg === 'method' && message.method === methodName) {
          // we need to timeout a little, otherwise the response id
          // will not yet be in Data.calls
          const response = { id: message.id };
          setTimeout(() => {
            server().emit('message', JSON.stringify(response));
          }, 5);
        }
      });

      c.insert({ foo: 'bar' }, (err, docId) => {
        expect(err).to.equal(null);
        expect(c.find().count()).to.equal(1);
        expect(c.findOne(docId)).to.deep.equal({
          _id: docId,
          foo: 'bar',
          _version: 1,
        });
        server().message(null);
        done();
      });
    });
    it('does not insert if server responded with error', function (done) {
      const c = new Collection(Random.id());
      expect(c.find().count()).to.equal(0);
      const methodName = `/${c._name}/insert`;
      server().message((messageStr) => {
        const message = JSON.parse(messageStr);

        if (message.msg === 'method' && message.method === methodName) {
          // we need to timeout a little, otherwise the response id
          // will not yet be in Data.calls
          const response = { id: message.id, error: 'expect this err' };
          setTimeout(() => {
            server().emit('message', JSON.stringify(response));
          }, 5);
        }
      });

      c.insert({ foo: 'bar' }, (err, docId) => {
        expect(docId).to.equal(undefined);
        expect(c.find().count()).to.equal(0);
        expect(c.findOne(docId)).to.deep.equal(undefined);
        expect(err).to.equal('expect this err');
        server().message(null);
        done();
      });
    });
    it('inserts sync on a local collection', function (done) {
      const c = new Collection(null);
      expect(c.find().count()).to.equal(0);
      const docId = c.insert({ foo: 'bar' });
      expect(c.find().count()).to.equal(1);
      expect(c.findOne(docId)).to.deep.equal({
        _id: docId,
        foo: 'bar',
        _version: 1,
      });

      // throws on reinsert
      c.insert({ _id: docId }, (err) => {
        expect(err).to.deep.equal({
          error: 409,
          reason: `Duplicate key _id with value ${docId}`,
        });
        done();
      });
    });
  });

  describe('update', function () {
    it('updates a doc', function (done) {
      const c = new Collection(Random.id());
      expect(c.find().count()).to.equal(0);

      const insertMethod = `/${c._name}/insert`;
      const updateMethod = `/${c._name}/update`;
      server().message((messageStr) => {
        const message = JSON.parse(messageStr);

        if (
          message.msg === 'method' &&
          [insertMethod, updateMethod].includes(message.method)
        ) {
          // we need to timeout a little, otherwise the response id
          // will not yet be in Data.calls
          const response = { id: message.id };
          setTimeout(() => {
            server().emit('message', JSON.stringify(response));
          }, 5);
        }
      });

      c.insert({ foo: 'bar' }, (err, docId) => {
        c.update(docId, { $set: { foo: 'baz' } }, (err, docId2) => {
          expect(err).to.equal(null);
          expect(docId2).to.equal(docId);
          expect(c.find().count()).to.equal(1);
          expect(c.findOne(docId)).to.deep.equal({
            _id: docId,
            foo: 'baz',
            _version: 2,
          });
          server().message(null);
          done();
        });
      });
    });
    it('resolves to error if the server responds with error', function (done) {
      const c = new Collection(Random.id());
      expect(c.find().count()).to.equal(0);

      const insertMethod = `/${c._name}/insert`;
      const updateMethod = `/${c._name}/update`;
      server().message((messageStr) => {
        const message = JSON.parse(messageStr);

        if (
          message.msg === 'method' &&
          [insertMethod, updateMethod].includes(message.method)
        ) {
          // we need to timeout a little, otherwise the response id
          // will not yet be in Data.calls
          const response = { id: message.id };

          if (message.method === updateMethod) {
            response.error = 'expect this update err';
          }

          setTimeout(() => {
            server().emit('message', JSON.stringify(response));
          }, 5);
        }
      });

      c.insert({ foo: 'bar' }, (err, docId) => {
        c.update(docId, { $set: { foo: 'baz' } }, (err, docId2) => {
          expect(docId2).to.equal(undefined);
          expect(err).to.equal('expect this update err');
          expect(c.find().count()).to.equal(1);

          // TODO this should be the "old" doc
          expect(c.findOne(docId)).to.deep.equal({
            _id: docId,
            foo: 'baz',
            _version: 2,
          });
          server().message(null);
          done();
        });
      });
    });
    it('updates a doc on a local collection', function () {
      const c = new Collection(null);
      const docId = c.insert({});
      c.update(docId, { $set: { foo: 'bar' } });
      c.update(docId, { $set: { foo: 'baz' } });
      const doc2 = c.findOne(docId);
      expect(doc2).to.deep.equal({ _id: docId, _version: 3, foo: 'baz' });
    });
    it('returns with an error if the doc is not found', function (done) {
      const c = new Collection(null);
      const id = Random.id();
      c.update(id, { $set: {} }, (err) => {
        expect(err).to.deep.equal({
          error: 409,
          reason: `Item not found in collection ${c._name} with id ${id}`,
        });
        done();
      });
    });
  });

  describe('remove', function () {
    it('removes a doc', function (done) {
      const c = new Collection(Random.id());
      expect(c.find().count()).to.equal(0);

      const insertMethod = `/${c._name}/insert`;
      const removeMethod = `/${c._name}/remove`;
      server().message((messageStr) => {
        const message = JSON.parse(messageStr);

        if (
          message.msg === 'method' &&
          [insertMethod, removeMethod].includes(message.method)
        ) {
          // we need to timeout a little, otherwise the response id
          // will not yet be in Data.calls
          const response = { id: message.id };
          setTimeout(() => {
            server().emit('message', JSON.stringify(response));
          }, 5);
        }
      });

      c.insert({ foo: 'bar' }, (err, docId) => {
        c.remove(docId, (err, docId2) => {
          expect(err).to.equal(null);
          expect(docId2).to.equal(undefined);
          expect(c.find().count()).to.equal(0);
          expect(c.findOne(docId)).to.deep.equal(undefined);
          server().message(null);
          done();
        });
      });
    });
    it('does not remove if server responds with error', function (done) {
      const c = new Collection(Random.id());
      expect(c.find().count()).to.equal(0);

      const insertMethod = `/${c._name}/insert`;
      const removeMethod = `/${c._name}/remove`;
      server().message((messageStr) => {
        const message = JSON.parse(messageStr);

        if (
          message.msg === 'method' &&
          [insertMethod, removeMethod].includes(message.method)
        ) {
          // we need to timeout a little, otherwise the response id
          // will not yet be in Data.calls
          const response = { id: message.id };

          if (message.method === removeMethod) {
            response.error = 'expect this remove err';
          }

          setTimeout(() => {
            server().emit('message', JSON.stringify(response));
          }, 5);
        }
      });

      c.insert({ foo: 'bar' }, (err, docId) => {
        c.remove(docId, (err) => {
          expect(err).to.equal('expect this remove err');
          expect(c.find().count()).to.equal(1);
          expect(c.findOne(docId)).to.deep.equal({
            _id: docId,
            foo: 'bar',
            _version: 3, // because it got upserted again
          });
          server().message(null);
          done();
        });
      });
    });
    it('removes a doc on a local collection', function () {
      const c = new Collection(null);
      expect(c.find().count()).to.equal(0);
      const docId = c.insert({});
      expect(c.find().count()).to.equal(1);
      c.remove(docId);
      expect(c.find().count()).to.equal(0);

      c.insert({ foo: 'bar' });
      c.insert({ foo: 'baz' });
      expect(c.find().count()).to.equal(2);
      c.remove({ foo: 'bar' });
      expect(c.find().count()).to.equal(1);
    });
    it('returns with an error if the doc is not found', function (done) {
      const c = new Collection(null);
      c.remove({}, (err) => {
        expect(err).to.equal('No document with _id : [object Object]');
        done();
      });
    });
  });
});

describe('Cursor', function () {
  let c;

  beforeEach(function () {
    c = new Collection(null);
  });

  it('count', function () {
    c.insert({ foo: Random.id() });
    c.insert({ foo: Random.id() });
    c.insert({ foo: Random.id() });
    const cursor = c.find({
      foo: { $exists: true },
    });
    expect(cursor.count()).to.equal(3);
  });
  it('fetch', function () {
    const docs = [
      { foo: Random.id(8) },
      { foo: Random.id(8) },
      { foo: Random.id(8) },
      { foo: Random.id(8) },
    ].map((doc) => {
      const docId = c.insert(doc);
      return c.findOne(docId);
    });

    const cursor = c.find({});
    // expect(cursor.count()).to.equal(4);

    expect(cursor.fetch()).to.deep.equal(docs);
  });
  it('forEach', function () {
    const docs = [
      { foo: Random.id(8) },
      { foo: Random.id(8) },
      { foo: Random.id(8) },
      { foo: Random.id(8) },
    ].map((doc) => {
      const docId = c.insert(doc);
      return c.findOne(docId);
    });

    const cursor = c.find({});
    // expect(cursor.count()).to.equal(4);

    cursor.forEach((doc, index) => {
      expect(docs[index]).to.deep.equal(doc);
    });
  });
  it('_transformedDocs', function () {
    c = new Collection(null, {
      transform: (doc) => {
        doc.bar = 'baz';
        return doc;
      },
    });
    const docId = c.insert({ foo: 'bar' });
    const doc = c.find({}).fetch()[0];

    expect(doc).to.deep.equal({
      _id: docId,
      foo: 'bar',
      bar: 'baz',
      _version: 1,
    });
  });
  it('map', function () {
    const docs = [
      { foo: Random.id(8) },
      { foo: Random.id(8) },
      { foo: Random.id(8) },
      { foo: Random.id(8) },
    ].map((doc) => {
      const docId = c.insert(doc);
      return c.findOne(docId);
    });

    const cursor = c.find({});
    // expect(cursor.count()).to.equal(4);

    const docs2 = cursor.map((doc, index) => {
      expect(docs[index]).to.deep.equal(doc);
      return doc;
    });

    expect(docs2).to.not.equal(docs);
  });
  // observer see runObservers
});

describe('runObservers', function () {
  it('runs observers for registered added callback', function (done) {
    const c = new Collection(null);
    let foo = Random.id();
    c.find().observe({
      added(newDoc, oldDoc) {
        expect(oldDoc).to.equal(undefined);
        expect(newDoc.foo).to.equal(foo);
        done();
      },
    });

    const docId = c.insert({ foo: foo });
    const doc = c.findOne(docId);
  });
  it('runs observers for registered changed callback', function (done) {
    const c = new Collection(null);
    c.find().observe({
      changed(newDoc, oldDoc) {
        expect(newDoc).to.not.deep.equal(oldDoc);
        expect(newDoc._id).to.equal(oldDoc._id);
        done();
      },
    });

    const docId = c.insert({ foo: Random.id() });
    const doc = c.findOne(docId);
    c.update(docId, { $set: { foo: 'bar' } });
    const doc2 = c.findOne(docId);
  });
  it('runs observers for registered remove callback', function (done) {
    const c = new Collection(null);
    const expectDocId = c.insert({ foo: Random.id() });
    const expectDoc = c.findOne();

    c.find().observe({
      removed(doc) {
        expect(doc).to.deep.equal(expectDoc);
        done();
      },
    });

    c.remove(expectDocId);
  });
  it('catches overseve callback errors', function () {
    const c = new Collection(null);
    c.find().observe({
      added() {
        throw new Error();
      },
    });

    const docId = c.insert({ foo: Random.id() });
    const doc = c.findOne(docId);
    //   runObservers('added', c._name, doc);
  });
});
