import { expect } from 'chai';
import Meteor from '../../src/Meteor';
import Mongo from '../../src/Mongo';
import { awaitDisconnected, stub, restoreAll } from '../testHelpers';
import DDP from '../../lib/ddp';
import { endpoint } from '../testHelpers';
import { server } from '../hooks/mockServer';
import Random from '../../lib/Random';
import Tracker from '../../src/Tracker';

Meteor.enableVerbose();

describe('Meteor - integration', function () {
  beforeEach(awaitDisconnected);
  afterEach(() => {
    restoreAll();
  });

  it('uses the default async storage if none is defined', function () {
    const fallback =
      require('@react-native-async-storage/async-storage').default;
    const { AsyncStorage } = Meteor.packageInterface();
    expect(AsyncStorage).to.equal(fallback);
  });

  describe('deprecated', () => {
    it('throws if Meteor.collection is used', () => {
      expect(() => new Meteor.collection()).to.throw(
        'Meteor.collection is deprecated. Use Mongo.Collection'
      );
    });
  });

  describe(Meteor.connect.name, () => {
    before(awaitDisconnected);
    afterEach(() => {
      restoreAll();
    });

    it('requires manual connect if autoConnect is  set to false', function (done) {
      this.timeout(3000);
      expect(Meteor.getData().ddp.status).to.equal('disconnected');
      stub(DDP.prototype, 'on', () => {});
      let connectCalled = 0;
      stub(DDP.prototype, 'connect', () => {
        done(new Error('should not automatically call connect'));
      });

      const AsyncStorage = {
        getItem: async () => {},
        setItem: async () => {},
        removeItem: async () => {},
      };

      const endpoint = `ws://localhost:3000/websocket`;
      Meteor.connect(endpoint, {
        AsyncStorage,
        NetInfo: null,
        autoConnect: false,
      });

      // let's wait some time to make sure no internals
      // unintentionally call ddp.connect before we do
      setTimeout(() => {
        expect(Meteor.getData().ddp.status).to.equal('disconnected');
        done();
      }, 2900);
    });

    it('allows to bypass NetInfo', (done) => {
      stub(DDP.prototype, 'on', () => {});
      stub(DDP.prototype, 'connect', done);

      const AsyncStorage = {
        getItem: async () => {},
        setItem: async () => {},
        removeItem: async () => {},
      };

      Meteor.connect(endpoint, {
        AsyncStorage,
        NetInfo: null,
      });
    });
    it('allows to pass a custom configured NetInfo', (done) => {
      stub(DDP.prototype, 'on', () => {});

      let connectCalled = 0;
      stub(DDP.prototype, 'connect', () => {
        connectCalled++;
        if (connectCalled > 1) {
          done(new Error('should not call more than once!'));
        } else {
          done();
        }
      });

      const AsyncStorage = {
        getItem: async () => {},
        setItem: async () => {},
        removeItem: async () => {},
      };

      const NetInfo = {
        addEventListener: (cb) => {
          setTimeout(() => {
            cb({ isConnected: true });
          }, 0);
        },
      };

      Meteor.connect(endpoint, {
        AsyncStorage,
        NetInfo,
        autoReconnect: true,
      });
    });
  });
  describe('call', () => {
    it('calls a server Method', (done) => {
      Meteor.connect(endpoint, { NetInfo: null });

      server().method({ name: 'foo', response: () => 'bar' });

      Meteor.getData().waitDdpConnected(() => {
        Meteor.call('foo'); // silent response
        Meteor.call('foo', (err, res) => {
          expect(err).to.equal(undefined);
          expect(res).to.equal('bar');
          done();
        });
      });
    });
  });
  describe(Meteor.subscribe.name, () => {
    it('subscribes to a server publication', (done) => {
      Meteor.connect(endpoint, { NetInfo: null, autoConnect: false });
      const collection = new Mongo.Collection('foobarSubs');
      const _id = Random.id();

      server().publish({
        name: 'bar',
        collection: 'foobarSubs',
        getDocs: () => ({ _id, foo: 'bar' }),
      });

      let readyCalled = false;
      Meteor.getData().waitDdpConnected(() => {
        setTimeout(() => {
          const handle = Meteor.subscribe('bar', {
            onReady: () => {
              expect(collection.find({}).fetch()).to.deep.equal([
                { _id, foo: 'bar', _version: 1 },
              ]);
              readyCalled = true;
              handle.stop();
            },
            onStop: () => {
              setTimeout(() => {
                // doc should have been removed
                expect(collection.find({}).fetch()).to.deep.equal([]);
                done();
              }, 200);
            },
          });
        }, 100);
      });

      Meteor.reconnect();
    });
    it('returns a reactive handle to resolve ready state', (done) => {
      Meteor.isVerbose = false;
      Meteor.connect(endpoint, { NetInfo: null, autoConnect: false });
      const collection = new Mongo.Collection('bazSubs');
      const _id = Random.id();

      server().publish({
        name: 'baz',
        collection: 'bazSubs',
        getDocs: () => ({ _id, foo: 'bar' }),
      });

      Meteor.getData().waitDdpConnected(() => {
        setTimeout(() => {
          const handle = Meteor.subscribe('baz');

          Tracker.autorun((c) => {
            console.debug('autorun', handle, handle.ready());
            if (handle.ready()) {
              expect(collection.find({}).fetch()).to.deep.equal([
                { _id, foo: 'bar', _version: 1 },
              ]);
              c.stop();
              done();
            }
          });
        }, 100);
      });

      Meteor.reconnect();
    });
  });
});
