import Data from '../Data';
import call from '../Call';
import User from './User';
import { hashPassword } from '../../lib/utils';
import Meteor from '../Meteor.js';

/**
 * Reference implementation to Meteor-Accounts client.
 * Use this to create and manage user accounts.
 *
 * @class
 * @see https://docs.meteor.com/api/accounts
 * @see https://docs.meteor.com/api/passwords
 * @see https://github.com/meteor/meteor/blob/devel/packages/accounts-password/password_client.js
 */
class AccountsPassword {
  _hashPassword = hashPassword;

  /**
   * Create a new user.
   * @param {Object} options
   * @param {String} options.username A unique name for this user.
   * @param {String} options.email The user's email address.
   * @param {String} options.password The user's password. This is __not__ sent in plain text over the wire.
   * @param {Object} options.profile The user's profile, typically including the `name` field.
   * @param {Function} [callback] Client only, optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
   */
  createUser = (options, callback = () => {}) => {
    options = { ...options };

    if (typeof options.password !== 'string') {
      throw new Error('options.password must be a string');
    }
    if (!options.password) {
      return callback(new Error('Password may not be empty'));
    }

    // Replace password with the hashed password.
    options.password = hashPassword(options.password);

    User._startLoggingIn();
    call('createUser', options, (err, result) => {
      Meteor.isVerbose &&
        console.info('Accounts.createUser::: err:', err, 'result:', result);

      User._endLoggingIn();
      User._handleLoginCallback(err, result);
      callback(err);
    });
  };

  /**
   * Changes the password of the current authenticated user
   * @param oldPassword {string} must be the correct old password
   * @param newPassword {string} a new password to replace the old
   * @param callback {function(e:Error)=} optional callback that is invoked with one optional error argument
   */
  changePassword = (oldPassword, newPassword, callback = () => {}) => {
    if (!User.user()) {
      return callback(new Error('Must be logged in to change password'));
    }

    if (!(typeof newPassword === 'string' || newPassword instanceof String)) {
      return callback(new Error('Password must be a string'));
    }

    if (!newPassword) {
      return callback(new Error('Password may not be empty'));
    }

    call(
      'changePassword',
      oldPassword ? hashPassword(oldPassword) : null,
      hashPassword(newPassword),
      callback
    );
  };

  /**
   * Sends an email to the user with a link to set a new password
   * @param options {object}
   * @param options.email {string} the email to use for sending the restore link
   * @param callback {function(e:Error)=} optional callback that is invoked with one optional error argument
   */
  forgotPassword = (options, callback = () => {}) => {
    if (!options.email) {
      return callback(new Error('Must pass options.email'));
    }

    call('forgotPassword', options, callback);
  };

  /**
   * Reset the password for a user using a token received in email.
   * Logs the user in afterwards if the user doesn't have 2FA enabled.
   * @param token {string} The token retrieved from the reset password URL.
   * @param newPassword {string}
   * @param callback {function(e:Error)=} optional callback that is invoked with one optional error argument
   */
  resetPassword = (token, newPassword, callback = () => {}) => {
    if (!(typeof token === 'string' || token instanceof String)) {
      return callback(new Error('Token must be a string'));
    }

    if (!(typeof newPassword === 'string' || newPassword instanceof String)) {
      return callback(new Error('Password must be a string'));
    }

    if (!newPassword) {
      return callback(new Error('Password may not be empty'));
    }

    call('resetPassword', token, hashPassword(newPassword), (err, result) => {
      Meteor.isVerbose &&
        console.info('Accounts.resetPassword::: err:', err, 'result:', result);
      if (!err) {
        User._loginWithToken(result.token);
      }

      callback(err);
    });
  };

  /**
   * Register a callback to be called after a login attempt succeeds.
   * @param cb {function} The callback to be called when login is successful.
   *   The callback receives the event, passed from the Data layer, which is different
   *   from what a callback receives when this method is used in the Meteor web client.
   */
  onLogin = (cb) => {
    if (Data._tokenIdSaved) {
      // Execute callback immediately if already logged in
      return cb();
    }
    Data.on('onLogin', cb);
  };

  /**
   * Register a callback to be called after a login attempt fails.
   * @param cb
   */
  onLoginFailure = (cb) => {
    Data.on('onLoginFailure', cb);
  };

  /**
   * Verify if the logged user has 2FA enabled
   * @param callback {function} Called with a boolean on success that indicates whether the user has or not 2FA enabled,
   * or with a single Error argument on failure.
   */
  has2faEnabled = (callback = () => {}) => {
    call('has2faEnabled', callback);
  };
}

export default new AccountsPassword();
