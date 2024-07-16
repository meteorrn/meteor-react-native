import Meteor from '../../src/Meteor';
import User from '../../src/user/User';
import Random from '../../lib/Random';
import { restoreAll, stub } from '../testHelpers';
import { expect } from 'chai';
import ReactiveDict from '../../src/ReactiveDict';

describe('User', () => {
  let userId;
  let user;
  beforeEach(() => {
    userId = Random.id(17);
    User.users.insert({
      _id: userId,
      username: 'foobar',
    });
    user = User.users.findOne(userId);
  });
  afterEach(() => {
    restoreAll();
    User.users.remove({ _id: userId });
    User._reactiveDict = new ReactiveDict();
  });
  describe(User.user.name, function () {
    it('returns the current user if defined', () => {
      expect(User.user()).to.equal(null);
      User._reactiveDict.set('_userIdSaved', userId);
      expect(User.user()).to.equal(user);
    });
  });
  describe(User.userId.name, function () {
    it('returns the current userId if defined', () => {
      expect(User.userId()).to.equal(null);
      User._reactiveDict.set('_userIdSaved', userId);
      expect(User.userId()).to.equal(userId);
    });
  });
  describe(User.loginWithPassword.name, function () {
    it('calls to backend with login', (done) => {
      const username = 'foo';

      const cbHandled = stub(User, '_handleLoginCallback', () => {});
      stub(Meteor, 'call', (name, options, cb) => {
        expect(name).to.equal('login');
        const { user, password, code } = options;
        expect(user).to.deep.equal({ username });
        expect(password.algorithm).to.equal('sha-256');
        expect(password.digest.length).to.equal(64);
        expect(code).to.equal(undefined);
        setTimeout(() => cb(), 10);
      });

      User.loginWithPassword(username, 'moo', () => {
        expect(cbHandled.calledOnce).to.equal(true);
        expect(User._isTokenLogin).to.equal(false);
        done();
      });
    });
  });
  describe(User.loginWithPasswordAnd2faCode.name, function () {
    it('calls the backend login method', (done) => {
      const username = 'foo';
      const cbHandled = stub(User, '_handleLoginCallback', () => {});
      stub(Meteor, 'call', (name, options, cb) => {
        expect(name).to.equal('login');
        const { user, password, code } = options;
        expect(user).to.deep.equal({ username });
        expect(password.algorithm).to.equal('sha-256');
        expect(password.digest.length).to.equal(64);
        expect(code).to.equal(1234);
        setTimeout(() => cb(), 10);
      });

      User.loginWithPasswordAnd2faCode(username, 'moo', 1234, () => {
        expect(cbHandled.calledOnce).to.equal(true);
        expect(User._isTokenLogin).to.equal(false);
        done();
      });
    });
  });
  describe(User.logoutOtherClients.name, function () {
    it('calls the backend methods', (done) => {
      const cbHandled = stub(User, '_handleLoginCallback', () => {});
      stub(Meteor, 'call', (name, cb) => {
        setTimeout(() => cb(), 1);
      });

      User.logoutOtherClients(() => {
        expect(cbHandled.calledOnce).to.equal(true);
        done();
      });
    });
  });
  describe(User._handleLoginCallback.name, function () {
    it('is not implemented');
  });
  describe(User._loginWithToken.name, function () {
    it('is not implemented');
  });
  describe(User.getAuthToken.name, function () {
    it('is not implemented');
  });
  describe(User._loadInitialUser.name, function () {
    it('is not implemented');
  });
  describe(User.logout.name, function () {
    it('is not implemented');
  });
  describe(User.handleLogout.name, function () {
    it('is not implemented');
  });
});
