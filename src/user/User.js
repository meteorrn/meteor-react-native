import Data from '../Data';
import { hashPassword } from '../../lib/utils';
import Mongo from '../Mongo';
import Meteor from '../Meteor.js';
import ReactiveDict from '../ReactiveDict';

// TODO make this configurable
const TOKEN_KEY = 'reactnativemeteor_usertoken';
const Users = new Mongo.Collection('users');
const userIdKey = '_userIdSaved';
const loggingInKey = '_loggingIn';

/**
 * @namespace User
 * @type {object}
 * @summary Represents all user/Accounts related functionality,
 * that is to be available on the `Meteor` Object.
 */
const User = {
  users: Users,
  _reactiveDict: new ReactiveDict(),

  user() {
    let user_id = this._reactiveDict.get(userIdKey);

    if (!user_id) return null;

    return Users.findOne(user_id);
  },
  userId() {
    let user_id = this._reactiveDict.get(userIdKey);

    if (!user_id) return null;

    const user = Users.findOne(user_id);
    return user && user._id;
  },
  _isLoggingIn: true,
  _isLoggingOut: false,
  loggingIn() {
    return !!this._reactiveDict.get(loggingInKey);
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
    this._reactiveDict.set(userIdKey, null);

    User._userIdSaved = null;
    User._endLoggingOut();
  },
  loginWithPassword(selector, password, callback) {
    this._isTokenLogin = false;
    login({ selector, password, callback });
  },
  loginWithPasswordAnd2faCode(selector, password, code, callback) {
    this._isTokenLogin = false;
    login({ selector, password, code, callback });
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
    this._reactiveDict.set(loggingInKey, true);
    Data.notify('loggingIn');
  },
  _startLoggingOut() {
    User._isLoggingOut = true;
    Data.notify('loggingOut');
  },
  _endLoggingIn() {
    this._reactiveDict.set(loggingInKey, false);
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
      this._reactiveDict.set(userIdKey, result.id);
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
      // we delegate the error to enable better logging
      Data.notify('onLoginFailure', err);
    }
    Data.notify('change');
  },

  _timeout: 50,
  _isTokenLogin: false,
  _isCallingLogin: false,
  _loginWithToken(value) {
    if (!value) {
      Meteor.isVerbose &&
        console.info(
          'User._loginWithToken::: parameter value is null, will not save as token.'
        );
    } else {
      Data._tokenIdSaved = value;
    }

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
        } else if (err?.error === 403) {
          User.logout();
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
    let value = null;
    try {
      value = await Data._options.AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.warn('AsyncStorage error: ' + error.message);
    } finally {
      User._loginWithToken(value);
    }
  },
};

const login = ({ selector, password, code, callback }) => {
  if (typeof selector === 'string') {
    if (selector.indexOf('@') === -1) {
      selector = { username: selector };
    } else {
      selector = { email: selector };
    }
  }

  const options = {
    user: selector,
    password: hashPassword(password),
  };

  if (typeof code !== 'undefined') {
    options.code = code;
  }

  User._startLoggingIn();
  Meteor.call('login', options, (err, result) => {
    User._handleLoginCallback(err, result);

    typeof callback == 'function' && callback(err);
  });
};

export default User;
