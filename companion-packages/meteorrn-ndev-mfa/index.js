import Meteor, { Accounts } from '@meteorrn/core';

import { loginChallengeHandler, loginCompletionHandler } from './method-names';

let useU2FAuthorizationCode = function (code) {
  if (typeof code !== 'string' || code.length !== 6) {
    throw new Error('Invalid Code');
  }

  return { U2FAuthorizationCode: code };
};

let assembleChallengeCompletionArguments = async function (
  finishLoginParams,
  code
) {
  let { res } = finishLoginParams;
  let methodArguments = [];

  if (res.method === 'u2f') {
    let assertion;
    if (code && code.U2FAuthorizationCode) {
      /*
                We require that the MFA.useU2FAuthorizationCode method is used
                even though we just pull the code out to make sure the code isn't
                actually an OTP due to a coding error.
            */
      let { challengeId, challengeSecret } = finishLoginParams.res;
      assertion = { challengeId, challengeSecret, ...code };
    } else {
      throw new Error('Code must be a U2FAuthorizationCode');
    }
    methodArguments.push(assertion);
  }

  if (res.method === 'otp' || res.method === 'totp') {
    if (!code) {
      throw new Meteor.Error('otp-required', 'An OTP is required');
    }

    methodArguments.push({ ...res, code });
  }

  return methodArguments;
};

let finishLogin = (finishLoginParams, code) =>
  new Promise(async (resolve, reject) => {
    let methodName = loginCompletionHandler();
    let methodArguments = await assembleChallengeCompletionArguments(
      finishLoginParams,
      code
    );

    Meteor._startLoggingIn();
    Meteor.call(methodName, ...methodArguments, (err, result) => {
      Meteor._endLoggingIn();
      Meteor._handleLoginCallback(err, result);

      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

let loginWithMFA = (username, password) =>
  new Promise((resolve, reject) => {
    Meteor.call(
      loginChallengeHandler(),
      username,
      Accounts._hashPassword(password),
      async (err, res) => {
        if (err) {
          return reject(err);
        }

        let finishLoginParams = { res, _type: 'login' };
        let doesSupportU2FLogin = false;

        resolve({
          supportsU2FLogin: doesSupportU2FLogin,
          method: res.method,
          finishLoginParams,
          finishParams: finishLoginParams,
        });
      }
    );
  });

let login = (username, password) =>
  new Promise((resolve, reject) => {
    Meteor.loginWithPassword(username, password, (err) => {
      if (err) {
        if (err.error === 'mfa-required') {
          loginWithMFA(username, password)
            .then(resolve)
            .catch(reject);
        } else {
          reject(err);
        }
      } else {
        resolve({ method: null });
      }
    });
  });

export default {
  useU2FAuthorizationCode,
  finishLogin,
  loginWithMFA,
  login,
};
