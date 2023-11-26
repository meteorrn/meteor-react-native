# Meteor React Native Docs

Table of Contents

- [Meteor](#meteor)
- [Tracker](#tracker)
- [Mongo](#mongo)
- [Accounts](#accounts)

<h2 id="meteor">Meteor</h2>

`import Meteor from '@meteorrn/core';`

### `Meteor.connect(url, options)`

Connect to the Meteor Server

**url**: The URL of your Meteor Server websocket. This should typically start with `ws://` (insecure, like `http://`) or `wss://` (secure, like `https://`), and have the path `/websocket`, e.g.: `wss://myapp.meteor.com/websocket`

**options**:

- autoConnect **boolean** [true] whether to establish the connection to the server upon instantiation. When false, one can manually establish the connection with the Meteor.ddp.connect method.
- autoReconnect **boolean** [true] whether to try to reconnect to the server when the socket connection closes, unless the closing was initiated by a call to the disconnect method.
- reconnectInterval **number** [10000] the interval in ms between reconnection attempts.
- AsyncStorage **object** your preferred AsyncStorage. Defaults to `'@react-native-async-storage/async-storage'` as a peer dependency.
- reachabilityUrl **string** ["https://clients3.google.com/generate_204"] server to check internet reachability, used by NetInfo. If not provided, NetInfos default url will be used, which currently is `'https://clients3.google.com/generate_204'`

### `Meteor.disconnect()`

Disconnect from the Meteor server

### `Meteor.call(name, [arg1, arg2...], [asyncCallback])`

Perform a call to a method

### `Meteor.subscribe(name, [arg1, arg2, arg3])`

Subscribe to a collection

### `Meteor.user()`

Returns the logged in user

### `Meteor.users`

Access the meteor users collection

### `Meteor.userId()`

Returns the userId of the logged in user

### `Meteor.status()`

Gets the current connection status. Returns an object with the following properties:

**connected**: Boolean

**status**: "connected" || "disconnected"

### `Meteor.loggingIn()`

Returns true if attempting to login

### `Meteor.loggingOut()`

Returns true if attempting to logout

### `Meteor.loginWithPassword(selector, password, callback)`

Logs a user in. If selector is a string containing `@`, then this will be interpreted as an email, other strings as a username. The selector can also be an object with a single key `email`, `id` or `username`.
The optional Callback is called with a single `Error` argument on failure.

If 2fa is enabled, the `error` property of the argument may be `no-2fa-code`. Read more in [the Meteor docs](https://docs.meteor.com/api/accounts#Meteor-loginWithPassword)

### `Meteor.loginWithPasswordAnd2faCode(selector, password, code, callback)`

Logs a user in, same as `loginWithPassword`, but providing a 2fa token via the argument `code`. Read more on this [in the Meteor docs](https://docs.meteor.com/packages/accounts-2fa.html).

### `Meteor.logout`

### `Meteor.logoutOtherClients`

<h2 id="tracker">Tracker</h2>

`import { withTracker, useTracker } from '@meteorrn/core'`;

#### `withTracker(trackerFunc)(Component)`

Creates a new Tracker

**Arguments:**

- trackerFunc - Function which will be re-run reactively when it's dependencies are updated. Must return an object that is passed as properties to `Component`
- Component - React Component which will receive properties from trackerFunc

#### `useTracker(trackerFunc)` => `React Hook`

Creates a new Tracker React Hook. Can only be used inside a function component. See React Docs for more info.

**Arguments:**

- trackerFunc - Function which will be re-run reactively when it's dependencies are updated.

## ReactiveDict

`import { ReactiveDict } from '@meteorrn/core'`

#### `new ReactiveDict()` => _`ReactiveDict`_

Creates a new reactive dictionary

#### _`ReactiveDict`_

**_ReactiveDict_ Methods:**

- .get(key) - Gets value of key (Reactive)
- .set(key, value) - Sets value of key

<h2 id="mongo">Mongo</h2>

`import { Mongo } from '@meteorrn/core';`

#### `new Mongo.Collection(collectionName, options)` => `Collection`

Creates and returns a _Collection_

**Arguments**

- collectionName - Name of the remote collection, or pass `null` for a client-side collection

#### _`Collection`_

**_Collection_ Methods:**

- .insert(document) - Inserts document into collection
- .update(query, modifications) - Updates document in collection
- .remove(query) - Removes document from collection
- .find(query) => _`Cursor`_ - Returns a Cursor
- .findOne(query) => Document - Retrieves first matching Document

#### _`Cursor`_

**_Cursor_ Methods:**

- .obsrve() - Mirrors Meteor's observe behavior. Accepts object with the properties `added`, `changed`, and `removed`.
- .fetch() => `[Document]` - Retrieves an array of matching documents

<h2 id="accounts">Accounts</h2>

`import { Accounts } from '@meteorrn/core';`

#### `Accounts.createUser(user, callback)`

Creates a user

**Arguments**

- user - The user object
- callback - Called with a single error object or null on success

#### `Accounts.changePassword(oldPassword, newPassword)`

Changes a user's password

**Arguments**

- oldPassword - The user's current password
- newPassword - The user's new password

#### `Accounts.onLogin(callback)`

Registers a callback to be called when user is logged in

**Arguments**

- callback

#### `Accounts.onLoginFailure(callback)`

Registers a callback to be called when login fails

**Arguments**

- callback

#### `Accounts._hashPassword(plaintext)` => `{algorithm:"sha-256", digest:"..."}`

Hashes a password using the sha-256 algorithm. Returns an object formatted for use in accounts calls. You can access the raw hashed string using the digest property.

**Arguments**

- plaintext - The plaintext string you want to hash

Other:

- [Accounts.forgotPassword](http://docs.meteor.com/#/full/accounts_changepassword)
- [Accounts.resetPassword](http://docs.meteor.com/#/full/accounts_resetpassword)

## Verbosity

`import { enableVerbose } from '@meteorrn/core';`

Verbose Mode logs detailed information from various places around MeteorRN. **Note:** this will expose login tokens and other private information to the console.

#### `enableVerbose()`

Enables verbose mode
