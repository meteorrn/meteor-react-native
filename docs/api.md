## withTracker
`import { withTracker } from 'meteor-react-native`;

The `withTracker` component is used the same way as [`meteor/react-meteor-data`](https://guide.meteor.com/react.html#using-withTracker)

```javascript
export default withTracker(() => {
    let handle = Meteor.subscribe("mySubscription");
    let loading = !handle.ready();
    let myStuff = Stuff.find({}).fetch();
    
    return {
        myStuff
    };
})(MyComponent);
```

## Meteor
`import Meteor from 'meteor-react-native`

#### `Meteor.connect(url, options)`
Connect to the Meteor Server

**options**:
* BREAKING: AsyncStorage **object** [No default]. You must import and set to your preferred AsyncStorage.  Tested libraries (must have one installed as dependency):
    - `{ AsyncStorage } from 'react-native'` (preferred if using Expo), OR
    - `{ AsyncStorage } from '@react-native-community/async-storage'` (defaulted fallback)
* autoConnect **boolean** [true] whether to establish the connection to the server upon instantiation. When false, one can manually establish the connection with the Meteor.ddp.connect method.
* autoReconnect **boolean** [true] whether to try to reconnect to the server when the socket connection closes, unless the closing was initiated by a call to the disconnect method.
* reconnectInterval **number** [10000] the interval in ms between reconnection attempts.

#### `Meteor.disconnect()`
Disconnect from the Meteor server

#### `Meteor.call(name, [arg1, arg2...], [asyncCallback])`
Perform a call to a method

#### `Meteor.subscribe(name, [arg1, arg2, arg3])`
Subscribe to a collection

#### `Meteor.user()`
Returns the logged in user

#### `Meteor.users`
Access the meteor users collection

#### `Meteor.userId()`
Returns the userId of the logged in user

#### `Meteor.status()`
Gets the current connection status. Returns an object with the following properties:

**connected**: Boolean

**status**: "connected" || "disconnected"

#### `Meteor.loggingIn()`
Returns true if attempting to login

#### `Meteor.loginWithPassword`

#### `Meteor.logout`

#### `Meteor.logoutOtherClients`



## ReactiveDict
`import { ReactiveDict } from 'meteor-react-native'`

https://atmospherejs.com/meteor/reactive-dict



## Mongo
`import { Mongo } from 'meteor-react-native';`

#### `Mongo.Collection(collectionName, options)`

**options**:
  * [.insert(doc, callback)](http://docs.meteor.com/#/full/insert)
  * [.update(id, modifier, [options], [callback])](http://docs.meteor.com/#/full/update)
  * [.remove(id, callback(err, countRemoved))](http://docs.meteor.com/#/full/remove)



## Accounts
`import { Accounts } from 'meteor-react-native';`

* [Accounts.createUser](http://docs.meteor.com/#/full/accounts_createuser)
* [Accounts.changePassword](http://docs.meteor.com/#/full/accounts_forgotpassword)
* [Accounts.forgotPassword](http://docs.meteor.com/#/full/accounts_changepassword)
* [Accounts.resetPassword](http://docs.meteor.com/#/full/accounts_resetpassword)
* [Accounts.onLogin](http://docs.meteor.com/#/full/accounts_onlogin)
* [Accounts.onLoginFailure](http://docs.meteor.com/#/full/accounts_onloginfailure)
* `Accounts._hashPassword` - SHA-256 hashes password, for use with methods that may require authentication
