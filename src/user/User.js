import Data from '../Data';
import { hashPassword } from '../../lib/utils';
import Mongo from '../Mongo';
import Meteor from '../Meteor.js';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const Users = new Mongo.Collection("users");

const User = {
  users:Users,
  user() {
    if (!User._userIdSaved) return null;

    return Users.findOne(User._userIdSaved);
  },
  userId() {
    if (!User._userIdSaved) return null;

    const user = Users.findOne(User._userIdSaved);
    return user && user._id;
  },
  _isLoggingIn: true,
  loggingIn() {
    return User._isLoggingIn;
  },
  logout(callback) {
    Meteor.call('logout', err => {
      User.handleLogout();
      Meteor.connect();

      typeof callback == 'function' && callback(err);
    });
  },
  handleLogout() {
    Data._options.AsyncStorage.removeItem(TOKEN_KEY);
    Data._tokenIdSaved = null;
    User._userIdSaved = null;
  },
  loginWithPassword(selector, password, callback) {
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
        User._endLoggingIn();

        User._handleLoginCallback(err, result);

        typeof callback == 'function' && callback(err);
      },
    );
  },
  logoutOtherClients(callback = () => {}) {
    Meteor.call('getNewToken', (err, res) => {
      if (err) return callback(err);

      User._handleLoginCallback(err, res);

      Meteor.call('removeOtherTokens', err => {
        callback(err);
      });
    });
  },
  _login(user, callback) {
    User._startLoggingIn();
    Meteor.call('login', user, (err, result) => {
      User._endLoggingIn();

      User._handleLoginCallback(err, result);

      typeof callback == 'function' && callback(err);
    });
  },
  _startLoggingIn() {
    User._isLoggingIn = true;
    Data.notify('loggingIn');
  },
  _endLoggingIn() {
    User._isLoggingIn = false;
    Data.notify('loggingIn');
  },
  _handleLoginCallback(err, result) {
    if (!err) {
      Meteor.isVerbose && console.info("User._handleLoginCallback::: token:", result.token, "id:", result.id);
      Data._options.AsyncStorage.setItem(TOKEN_KEY, result.token);
      Data._tokenIdSaved = result.token;
      User._userIdSaved = result.id;
      Data.notify('onLogin');
    } else {
      Meteor.isVerbose && console.info("User._handleLoginCallback::: error:", err);
      Data.notify('onLoginFailure');
      User.handleLogout();
    }
    Data.notify('change');
  },
  _loginWithToken(value) {
    Data._tokenIdSaved = value;
    if (value !== null) {
      Meteor.isVerbose && console.info("User._loginWithToken::: token:", value);
      User._startLoggingIn();
      Meteor.call('login', { resume: value }, (err, result) => {
        User._endLoggingIn();
        User._handleLoginCallback(err, result);
      });
    } else {
      Meteor.isVerbose && console.info("User._loginWithToken::: token is null");
      User._endLoggingIn();
    }
  },
  getAuthToken() {
    return Data._tokenIdSaved;
  },
  async _loadInitialUser() {
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

User.loginWithToken = User._loginWithToken;

export default User;
