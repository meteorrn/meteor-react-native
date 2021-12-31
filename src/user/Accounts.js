import Data from '../Data';
import call from '../Call';
import User from './User';
import { hashPassword } from '../../lib/utils';
import Meteor from '../Meteor.js';

class AccountsPassword {
  _hashPassword = hashPassword;

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

  changePassword = (oldPassword, newPassword, callback = () => {}) => {
    //TODO check Meteor.user() to prevent if not logged

    if (typeof newPassword != 'string' || !newPassword) {
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

  forgotPassword = (options, callback = () => {}) => {
    if (!options.email) {
      return callback('Must pass options.email');
    }

    call('forgotPassword', options, err => {
      callback(err);
    });
  };

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

  onLogin = cb => {
    if (Data._tokenIdSaved) {
      // Execute callback immediately if already logged in
      return cb();
    }
    Data.on('onLogin', cb);
  };

  onLoginFailure = cb => {
    Data.on('onLoginFailure', cb);
  };
}

export default new AccountsPassword();
