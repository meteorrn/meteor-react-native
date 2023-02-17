**This is a pre-release package, it is not yet ready for production**

# ndev:mfa for MeteorRN

This pacakge allows your MeteorRN app to interact with `ndev:mfa`. It does not support using a security key, but for users with u2f MFA, it takes advantage of the U2F Authorization Code feature. This package exposes the following client methods for MFA.

- useU2FAuthorizationCode
- finishLogin
- loginWithMFA
- login

Here's a simple login flow:

```
import MFA from '@meteorrn/ndev-mfa';

MFA.login(username, password).then(r => {
    if(r.method === null) {
        // Login Complete
    }
    else {
        let code = await collectTheCodeSomehow();

        if(r.method === "u2f") {
          code = MFA.useU2FAuthorizationCode(code);
        }

        MFA.finishLogin(r.finishLoginParams, code).then(() => {
            // Login Complete
        }).catch(err => {
            // Error (Invalid Code?)
        });
    }
}).catch(err => {
    // Error (Incorrect Password? Invalid Account?)
});

```
