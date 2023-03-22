import Data from '../Data';
import { hashPassword } from '../../lib/utils';
import Mongo from '../Mongo';
import Meteor from '../Meteor.js';
import ReactiveDict from '../ReactiveDict';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const Users = new Mongo.Collection('users');

const User = {
  users: Users,
  _reactiveDict: new ReactiveDict(),

  user() {
    let user_id = this._reactiveDict.get('_userIdSaved');

    if (!user_id) return null;

    return Users.findOne(user_id);
  },
  userId() {
    let user_id = this._reactiveDict.get('_userIdSaved');

    if (!user_id) return null;

    const user = Users.findOne(user_id);
    return user && user._id;
  },
  _isLoggingIn: true,
  _isLoggingOut: false,
  loggingIn() {
    return this._reactiveDict.get('_loggingIn');
  },
  loggingOut() {
    return User._isLoggingOut;
  },
  logout(callback) {
    this._isTokenLogin = false;
    User._startLoggingOut();
    Meteor.call('logout', (err) => {
      User.handleLogout();
      Meteor.connect();

      typeof callback == 'function' && callback(err);
    });
  },
  handleLogout() {
    Data._options.AsyncStorage.removeItem(TOKEN_KEY);
    Data._tokenIdSaved = null;
    this._reactiveDict.set('_userIdSaved', null);

    User._userIdSaved = null;
    User._endLoggingOut();
  },
  loginWithPassword(selector, password, callback) {
    this._isTokenLogin = false;
    if (typeof selector === 'string') {
      if (selector.indexOf('@') === -1) selector = { username: selector };
      else selector = { email: selector };
    }

    User._startLoggingIn();
    Meteor.call(
      'login',
      {
        user: selector,
        password: hashPassword(password),
      },
      (err, result) => {
        User._handleLoginCallback(err, result);

        typeof callback == 'function' && callback(err);
      }
    );
  },
  logoutOtherClients(callback = () => {}) {
    Meteor.call('getNewToken', (err, res) => {
      if (err) return callback(err);

      User._handleLoginCallback(err, res);

      Meteor.call('removeOtherTokens', (err) => {
        callback(err);
      });
    });
  },
  _login(user, callback) {
    User._startLoggingIn();
    Meteor.call('login', user, (err, result) => {
      User._handleLoginCallback(err, result);

      typeof callback == 'function' && callback(err);
    });
  },
  _startLoggingIn() {
    this._reactiveDict.set('_loggingIn', true);
    Data.notify('loggingIn');
  },
  _startLoggingOut() {
    User._isLoggingOut = true;
    Data.notify('loggingOut');
  },
  _endLoggingIn() {
    this._reactiveDict.set('_loggingIn', false);
    Data.notify('loggingIn');
  },
  _endLoggingOut() {
    User._isLoggingOut = false;
    Data.notify('loggingOut');
  },
  _handleLoginCallback(err, result) {
    if (!err) {
      Meteor.isVerbose &&
        console.info(
          'User._handleLoginCallback::: token:',
          result.token,
          'id:',
          result.id
        );
      Data._options.AsyncStorage.setItem(TOKEN_KEY, result.token);
      Data._tokenIdSaved = result.token;
      this._reactiveDict.set('_userIdSaved', result.id);
      User._userIdSaved = result.id;
      User._endLoggingIn();
      this._isTokenLogin = false;
      Data.notify('onLogin');
    } else {
      Meteor.isVerbose &&
        console.info('User._handleLoginCallback::: error:', err);
      if (this._isTokenLogin) {
        setTimeout(() => {
          if (User._userIdSaved) {
            return;
          }
          this._timeout *= 2;
          if (Meteor.user()) {
            return;
          }
          User._loginWithToken(User._userIdSaved);
        }, this._timeout);
      }
      // Signify we aren't logginging in any more after a few seconds
      if (this._timeout > 2000) {
        User._endLoggingIn();
      }
      User._endLoggingIn();
      Data.notify('onLoginFailure');
    }
    Data.notify('change');
  },

  _timeout: 50,
  _isTokenLogin: false,
  _isCallingLogin: false,
  _loginWithToken(value) {
    Data._tokenIdSaved = value;
    if (value !== null) {
      this._isTokenLogin = true;
      Meteor.isVerbose && console.info('User._loginWithToken::: token:', value);
      if (this._isCallingLogin) {
        return;
      }
      this._isCallingLogin = true;
      User._startLoggingIn();
      Meteor.call('login', { resume: value }, (err, result) => {
        this._isCallingLogin = false;
        if (err?.error == 'too-many-requests') {
          Meteor.isVerbose &&
            console.info(
              'User._handleLoginCallback::: too many requests retrying:',
              err
            );
          let time = err.details?.timeToReset || err.timeToReset;
          setTimeout(() => {
            if (User._userIdSaved) {
              return;
            }
            this._loadInitialUser();
          }, time + 100);
        } else {
          User._handleLoginCallback(err, result);
        }
      });
    } else {
      Meteor.isVerbose && console.info('User._loginWithToken::: token is null');
      User._endLoggingIn();
    }
  },
  getAuthToken() {
    return Data._tokenIdSaved;
  },
  async _loadInitialUser() {
    this._timeout = 500;

    User._startLoggingIn();
    var value = null;
    try {
      value = await Data._options.AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.warn('AsyncStorage error: ' + error.message);
    } finally {
      User._loginWithToken(value);
    }
  },
};

export default User;
