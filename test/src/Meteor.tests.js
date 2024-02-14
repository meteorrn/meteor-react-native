import { expect } from 'chai';
import Meteor from '../../src/Meteor';
import { awaitDisconnected, stub, restoreAll } from '../testHelpers';
import DDP from '../../lib/ddp';

describe('Meteor - integration', function () {
  afterEach(() => {
    restoreAll();
  });

  it('uses the default async storage if none is defined', function () {
    const fallback =
      require('@react-native-async-storage/async-storage').default;
    const { AsyncStorage } = Meteor.packageInterface();
    expect(AsyncStorage).to.equal(fallback);
  });

  describe(Meteor.connect.name, () => {
    before(awaitDisconnected);

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

      const endpoint = `ws://localhost:3000/websocket`;
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

      const endpoint = `ws://localhost:3000/websocket`;
      Meteor.connect(endpoint, {
        AsyncStorage,
        NetInfo,
        autoReconnect: true,
      });
    });
  });
});
