import Data from '../../src/Data';
import Meteor from '../../src/Meteor';
import { expect } from 'chai';
import { awaitDisconnected, endpoint } from '../testHelpers';
import { restoreAll, stub } from '../testHelpers';
import User from '../../src/user/User';

describe('Data', function () {
  let data;
  beforeEach(async () => {
    await awaitDisconnected();
    data = Meteor.getData();
    expect(data.ddp.status).to.equal('disconnected');
  });
  afterEach(() => {
    restoreAll();
  });
  describe(Data.getUrl.name, function () {
    it('returns the endpoint url', () => {
      data._endpoint = null;
      expect(() => data.getUrl()).to.throw(
        'Expected a configured endpoint, got null, did you forget to call Meteor.connect({...})?'
      );
      data._endpoint = endpoint;
      const base = data.getUrl();
      expect(base).to.equal('ws://localhost:3000');
    });
  });
  describe(Data.waitDdpReady.name, () => {
    it('immediately resolves if DDP is available', (done) => {
      data.waitDdpReady(done);
    });
    it('waits until DDP is available', (done) => {
      const ddp = data.ddp;
      data.ddp = null;
      data.waitDdpReady(done);

      setTimeout(() => {
        data.ddp = ddp;
      }, 1000);
    });
  });
  describe(Data.waitDdpConnected.name, () => {
    it('immediately resolves if already connected', (done) => {
      let userLoaded = false;
      stub(User, '_loadInitialUser', () => ({
        then: () => {
          userLoaded = true;
        },
      }));

      const beforeDDP = data.ddp;
      Meteor.connect(endpoint, { NetInfo: null, autoConnect: false });
      expect(beforeDDP).to.not.equal(data.ddp);

      data.ddp.once('connected', () => {
        data.waitDdpConnected(() => {
          expect(userLoaded).to.equal(true);
          done();
        });
      });

      data.ddp.connect();
    });
    it('resolves, once connected', (done) => {
      const beforeDDP = data.ddp;
      Meteor.connect(endpoint, {
        NetInfo: null,
        autoConnect: false,
        autoReconnect: false,
      });
      expect(beforeDDP).to.not.equal(data.ddp);

      data.ddp.once('connected', () => {
        data.waitDdpConnected(() => done());
      });

      data.ddp.connect();
    });
    it('resolves, once ddp is ready and connected', (done) => {
      data.ddp = null;
      data.waitDdpConnected(() => {
        done();
      });
      Meteor.connect(endpoint, { NetInfo: null });
    });
  });
  describe(Data.onChange.name, () => {
    it('listens to various events of change and pipes them into a single callback', function (done) {
      this.timeout(5000);
      expect(data.ddp.status).to.equal('disconnected');
      /* Events:
       * - ddp: change
       * - ddp: connected
       * - ddp: disconnected
       * - Accounts: loggingIn
       * - Accounts: loggingOut
       * - DB: change
       */
      const events = new Set();
      const checkDone = function (name) {
        events.add(name);
        if (events.size >= 5) {
          data.offChange(checkDone);
          expect(data._onChangeWrappers).to.deep.equal({});
          expect([...events]).to.deep.equal([
            'connected',
            'loggingIn',
            'change',
            'loggingOut',
            'disconnected',
          ]);
          done();
        }
      };
      Meteor.connect(endpoint, {
        NetInfo: null,
        autoConnect: false,
        autoReconnect: false,
      });
      data = Meteor.getData();
      data.onChange(checkDone);
      data.ddp.connect();
      data.waitDdpConnected(() => {
        User.logout();
        Meteor.disconnect();
      });
    });
  });
  describe(Data.offChange.name, () => {
    it('is not implemented');
  });
  describe(Data.on.name, () => {
    it('is not implemented');
  });
  describe(Data.off.name, () => {
    it('is not implemented');
  });
  describe(Data.notify.name, () => {
    it('is not implemented');
  });
});
