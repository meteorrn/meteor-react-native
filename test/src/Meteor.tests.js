import { expect } from 'chai';
import Meteor from '../../src/Meteor';
import { awaitDisconnected, stub, restoreAll } from '../testHelpers';
import DDP from '../../lib/ddp';
import { endpoint } from '../testHelpers'

describe('Meteor - integration', function () {
  it('uses the default async storage if none is defined', function () {
    const fallback =
      require('@react-native-async-storage/async-storage').default;
    const { AsyncStorage } = Meteor.packageInterface();
    expect(AsyncStorage).to.equal(fallback);
  });

  describe(Meteor.connect.name, () => {
    beforeEach(awaitDisconnected);
    afterEach(() => {
      restoreAll();
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
        autoConnect: false,
      });
    });
    it('allows to pass a custom configured NetInfo', (done) => {
      stub(DDP.prototype, 'on', () => {});
      stub(DDP.prototype, 'connect', done);

      const AsyncStorage = {
        getItem: async () => {},
        setItem: async () => {},
        removeItem: async () => {},
      };

      const NetInfo = {
        addEventListener: (cb) => {
          setTimeout(() => cb({ isConnected: true }), 300);
        },
      };

      Meteor.connect(endpoint, {
        AsyncStorage,
        NetInfo,
        autoConnect: false,
        autoReconnect: true,
      });
    });
  });
});
