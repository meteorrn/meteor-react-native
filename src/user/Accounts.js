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
 */
class AccountsPassword {
  _hashPassword = hashPassword;

  /**
   *
   * @param options {object}
   * @param options.username {string=} username is optional, if an email is given
   * @param options.email {string=} email is optional, if a username is given
   * @param callback {function(e:Error)=} optional callback that is invoked with one optional error argument
   */
  createUser = (options, callback = () => {}) => {
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
    //TODO check Meteor.user() to prevent if not logged

    if (typeof newPassword != 'string' || !newPassword) {
      // TODO make callback(new Error(...)) instead
      return callback('Password may not be empty');
    }

    call(
      'changePassword',
      oldPassword ? hashPassword(oldPassword) : null,
      hashPassword(newPassword),
      (err, res) => {
        callback(err);
      }
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
      // TODO check this! I doubt it's implemented on the server
      //   to let the client decide which email to use.
      //   The only valid scenario is, when users have multiple emails
      //   but even then the prop should be optional as not ever user
      //   will have multiple emails
      return callback('Must pass options.email');
    }

    call('forgotPassword', options, (err) => {
      callback(err);
    });
  };

  /**
   * Reset the password for a user using a token received in email.
   * Logs the user in afterwards if the user doesn't have 2FA enabled.
   * @param token {string} The token retrieved from the reset password URL.
   * @param newPassword {string}
   * @param callback {function(e:Error)=} optional callback that is invoked with one optional error argument
   */
  resetPassword = (token, newPassword, callback = () => {}) => {
    if (!newPassword) {
      return callback('Must pass a new password');
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
