import Accounts from '../../src/user/Accounts';
import { expect } from 'chai';
import { restoreAll, stub } from '../testHelpers';
import User from '../../src/user/User'
import Data from '../../src/Data'
describe('Accounts', () => {
  before(() => {
    console.debug(Accounts)
  })

  afterEach(() => {
    restoreAll()
  })

  describe('createUser', function () {
    it('errors if password is not a string', () => {
      expect(() => Accounts.createUser())
        .to.throw('options.password must be a string')
    });
    it('errors if password is empty', done => {
      Accounts.createUser({ password: '' }, (err) => {
        expect(err.message).to.equal('Password may not be empty')
        done()
      })
    })
    it('calls the backend', done => {
      const startLogin = stub(User, '_startLoggingIn', () => {})
      const endedLogin = stub(User, '_endLoggingIn', () => {})
      const handleLogin = stub(User, '_handleLoginCallback', () => {})
      stub(Data, 'ddp', {
        method: (eventName, args) => {
          expect(eventName).to.equal('createUser')
          const options = args[0]
          expect(options.username).to.equal(username)
          const newPassword = options.password
          expect(newPassword.algorithm).to.equal('sha-256')
          expect(newPassword.digest.length).to.equal(64)
          return 999
        }
      })

      const username = 'foo'
      const password = 'moo'

      const cb = () => {
        expect(startLogin.calledOnce).to.equal(true)
        expect(endedLogin.calledOnce).to.equal(true)
        expect(handleLogin.calledOnce).to.equal(true)
        done()
      }
      Accounts.createUser({ username, password }, cb)
      const last = Data.calls.pop()
      expect(last.id).to.equal(999)
      last.callback()
    });
  });
  describe('changePassword', function () {
    it('errors if not logged in', (done) => {
      Accounts.changePassword(null, null, (err) => {
        expect(err.message).to.equal('Must be logged in to change password')
        done()
      })
    });
    it('errors if new password is not a string', (done) => {
      stub(User, 'user', () => ({ _id: 'foo'}))
      Accounts.changePassword(null, null, (err) => {
        expect(err.message).to.equal('Password must be a string')
        done()
      })
    });
    it('errors if new password is empty', (done) => {
      stub(User, 'user', () => ({ _id: 'foo'}))
      Accounts.changePassword(null, '', (err) => {
        expect(err.message).to.equal('Password may not be empty')
        done()
      })
    })
    it('calls the backend `changePassword` method', () => {
      stub(User, 'user', () => ({ _id: 'foo'}))
      stub(Data, 'ddp', {
        method: (eventName, args) => {
          expect(eventName).to.equal('changePassword')
          expect(args[0]).to.equal(null)
          const newPassword = args[1]
          expect(newPassword.algorithm).to.equal('sha-256')
          expect(newPassword.digest.length).to.equal(64)
          return 999
        }
      })
      const cb = () => {}
      Accounts.changePassword(null, 'foobar', cb)
      const last = Data.calls.pop()
      expect(last).to.deep.equal({ id: 999, callback: cb })
    });
  });
  describe('forgotPassword', function () {
    it('errors if no email is given', done => {
      Accounts.forgotPassword({}, err => {
        expect(err.message).to.equal('Must pass options.email')
        done()
      })
    });
    it('calls the backend method', () => {
      const email = 'foo@bar.moo'
      stub(Data, 'ddp', {
        method: (eventName, args) => {
          expect(eventName).to.equal('forgotPassword')
          expect(args[0]).to.deep.equal({ email });
          return 999
        }
      })
      const cb = () => {}
      Accounts.forgotPassword({ email }, cb)
      const last = Data.calls.pop()
      expect(last).to.deep.equal({ id: 999, callback: cb })
    })
  });
  describe('resetPassword', function () {
    it('errors if token is not a string', done => {
      Accounts.resetPassword(null, null, err => {
        expect(err.message).to.equal('Token must be a string')
        done()
      })
    });
    it('errors if password is not a string', done => {
      Accounts.resetPassword('foo', null, err => {
        expect(err.message).to.equal('Password must be a string')
        done()
      })
    });
    it('errors if password is empty', done => {
      Accounts.resetPassword('foo', '', err => {
        expect(err.message).to.equal('Password may not be empty')
        done()
      })
    });
    it('calls the backend method', (done) => {
      const token = 'foo'
      const passw = 'moo'
      const cb = () => {
        expect(loginStub.calledOnce).to.equal(true)
        done()
      }

      stub(Data, 'ddp', {
        method: (eventName, args) => {
          expect(eventName).to.equal('resetPassword')
          expect(args[0]).to.equal(token)
          const newPassword = args[1]
          expect(newPassword.algorithm).to.equal('sha-256')
          expect(newPassword.digest.length).to.equal(64)
          return 999
        }
      })

      const loginStub = stub(User, '_loginWithToken', t => {
        expect(t).to.equal('bar')
      })

      Accounts.resetPassword(token, passw, cb)

      const last = Data.calls.pop()
      expect(last.id).to.equal(999)
      last.callback(undefined, { token: 'bar' })


    });
  });
  describe('onLogin', function () {
    before(() => {
      if (!('_tokenIdSaved' in Data)) {
        Data._tokenIdSaved = null
      }
    })
    it('executes immediately if already logged in', done => {
      stub(Data, '_tokenIdSaved', true)
      Accounts.onLogin(() => done())
    });
    it('executes immediately if already logged in', done => {
      stub(Data, '_tokenIdSaved', () => null)
      stub(Data, 'on', (name, cb) => {
        expect(name).to.equal('onLogin')
        expect(cb).to.equal(callback)
        done()
      })
      const callback = () => {}
      Accounts.onLogin(callback)
    });
  });
  describe('onLoginFailure', function () {
    it('registers callback', (done) => {
      stub(Data, 'on', (name, cb) => {
        expect(name).to.equal('onLoginFailure')
        expect(cb).to.equal(callback)
        done()
      })
      const callback = () => {}
      Accounts.onLoginFailure(callback)
    });
  });
  describe('has2faEnabled', function () {
    it('calls to backend', () => {
      stub(Data, 'ddp', {
        method: (eventName, args) => {
          expect(eventName).to.equal('has2faEnabled')
          expect(args.length).to.equal(0)
          return 999
        }
      })
      const cb = () => {}
      Accounts.has2faEnabled(cb)
      const last = Data.calls.pop()
      expect(last).to.deep.equal({ id: 999, callback: cb })
    });
  });
});
