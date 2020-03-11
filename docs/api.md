# API

## Meteor
`import { Meteor } from 'react-native-meteor`

#### `Meteor.subscribe(name, [arg1, arg2, arg3])`
Subscribe to a collection

#### `Meteor.user()`
Returns the logged in user

#### `Meteor.userId()`
Returns the userId of the logged in user

#### `Meteor.status()`
Gets the current connection status. Returns an object with the following properties:

**connected**: Boolean

**status**: "connected" || "disconnected"


### `Meteor.loggingIn()`
Returns true if attempting to login

## ReactiveDict
`import { ReactiveDict } from 'react-native-meteor'`

https://atmospherejs.com/meteor/reactive-dict

## Collections
`import { Mongo } from 'react-native-meteor';`

* Mongo.Collection(collectionName, options)
  * [.insert(doc, callback)](http://docs.meteor.com/#/full/insert)
  * [.update(id, modifier, [options], [callback])](http://docs.meteor.com/#/full/update)
  * [.remove(id, callback(err, countRemoved))](http://docs.meteor.com/#/full/remove)

## Meteor DDP connection

### Meteor.connect(endpoint, options)

Connect to a DDP server. You only have to do this once in your app.

_Arguments_

* `url` **string** _required_
* `options` **object** Available options are :
  * autoConnect **boolean** [true] whether to establish the connection to the server upon instantiation. When false, one can manually establish the connection with the Meteor.ddp.connect method.
  * autoReconnect **boolean** [true] whether to try to reconnect to the server when the socket connection closes, unless the closing was initiated by a call to the disconnect method.
  * reconnectInterval **number** [10000] the interval in ms between reconnection attempts.

### Meteor.disconnect()

Disconnect from the DDP server.

## Meteor methods

* [Meteor.call](http://docs.meteor.com/#/full/meteor_call)
* [Meteor.loginWithPassword](http://docs.meteor.com/#/full/meteor_loginwithpassword) (Please note that user is auto-resigned in - like in Meteor Web applications - thanks to React Native AsyncStorage.)
* [Meteor.logout](http://docs.meteor.com/#/full/meteor_logout)
* [Meteor.logoutOtherClients](http://docs.meteor.com/#/full/meteor_logoutotherclients)

## Availables packages

### Convenience packages

Example `import { composeWithTracker } from 'react-native-meteor';`

* EJSON
* Tracker
* Accounts (see below)

### ReactiveDict

See [documentation](https://atmospherejs.com/meteor/reactive-dict).

### Meteor.Accounts

`import { Accounts } from 'react-native-meteor';`

* [Accounts.createUser](http://docs.meteor.com/#/full/accounts_createuser)
* [Accounts.changePassword](http://docs.meteor.com/#/full/accounts_forgotpassword)
* [Accounts.forgotPassword](http://docs.meteor.com/#/full/accounts_changepassword)
* [Accounts.resetPassword](http://docs.meteor.com/#/full/accounts_resetpassword)
* [Accounts.onLogin](http://docs.meteor.com/#/full/accounts_onlogin)
* [Accounts.onLoginFailure](http://docs.meteor.com/#/full/accounts_onloginfailure)

### Meteor.ddp

Once connected to the ddp server, you can access every method available in [ddp.js](https://github.com/mondora/ddp.js/).

* Meteor.ddp.on('connected')
* Meteor.ddp.on('added')
* Meteor.ddp.on('changed')
* ...
