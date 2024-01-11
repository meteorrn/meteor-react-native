<div align="center">
  <a href="https://github.com/meteorrn/meteor-react-native">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo.svg">
    <img alt="Novu Logo" src="logo.svg" width="280"/>
  </picture>
  </a>
</div>

<h1 align="center">Meteor React Native</h1>

<div align="center">

[![built for Meteor](https://img.shields.io/badge/Meteor-npm%20package-green?logo=meteor&logoColor=white)](https://meteor.com)
[![Node.js CI](https://github.com/meteorrn/meteor-react-native/actions/workflows/node.js.yml/badge.svg)](https://github.com/meteorrn/meteor-react-native/actions/workflows/node.js.yml)
[![CodeQL](https://github.com/meteorrn/meteor-react-native/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/meteorrn/meteor-react-native/actions/workflows/codeql-analysis.yml)
![npm version](https://img.shields.io/npm/v/%40meteorrn/core)
![npm downloads](https://img.shields.io/npm/dm/@meteorrn/core)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![NPM](https://img.shields.io/npm/l/%40meteorrn%2Fcore)

</div>

<p align="center">
Connect your React Native app to your Meteor server, and take advantage of Meteor-specific features like accounts, reactive data trackers, etc. Compatible with the latest version of React Native.
</p>

<p align="center">
<a href="https://guide.meteor.com/react-native.html">Meteor Guide</a>
<span>·</span>
<a href="https://dev.to/jankapunkt/meteor-and-react-native-create-a-native-mobile-app-2ile">Beginners Workshop</a>
<span>·</span>
<a href="https://github.com/meteorrn/meteor-react-native/blob/master/docs/api.md">Full API Documentation</a>
<span>·</span>
<a href="https://github.com/meteorrn/sample">Example Project</a>
<span>·</span>
<a href="https://github.com/jankapunkt/meteor-react-native-starter">Starter Template (Expo)</a>
<span>·</span>
<a href="https://github.com/meteorrn">More packages and resources</a>
</p>

## Features

- 🪄 Meteor's "automagical" features for your mobile app
- 🌱 Easy to set up and integrate
- 🚀 Build mobile apps with React-Native + Meteor in no time
- 🌈 Zero-Config Accounts / Authentication
- 📦 Storage-independent with zero-config defaults
- 👋 Supportive community in the [Meteor Forums](https://forums.meteor.com), [Slack](https://meteor-community.slack.com/) or [Discord](https://discord.gg/9GDmECsYdH)!

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
  - [Use a different async storage](#use-a-different-async-storage)
  - [Using Expo Secure Store](#using-expo-secure-store)
- [Basic Usage](#basic-usage)
- [Companion Packages](#companion-packages)
- [Compatibility](#compatibility)
- [Using on Web](#using-on-web)
- [Changelog](#changelog)
- [Package Interface](#package-interface)
  - [Usage of the package interface](#usage-of-the-package-interface)
  - [Differences from Meteor Core to Note:](#differences-from-meteor-core-to-note)
- [Showcase](#showcase)
- [Contribution and maintenance](#contribution-and-maintenance)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

1. `npm install --save @meteorrn/core`
2. Confirm you have peer dependencty `@react-native-community/netinfo` installed
3. Confirm you have `@react-native-async-storage/async-storage@>=1.8.1` installed.
   If you are using Expo, or otherwise cannot use `@react-native-async-storage/async-storage`, read below

### Use a different async storage

This package uses `@react-native-async-storage/async-storage` by default.
This may cause issues if you are using certain React Native versions, or if you are using Expo.
To use a custom AsyncStorage implementation, pass it as an option in `Meteor.connect`:

```javascript
import { AsyncStorage } from 'react-native';

// ...

Meteor.connect('wss://myapp.meteor.com/websocket', { AsyncStorage });
```

If you are using the `AsyncStorage` API yourself, its important that you use the same version that MeteorRN is using, or issues could be caused due to the conflicting versions.

Make sure you are using the same AsyncStorage you pass into Meteor (or `@react-native-async-storage/async-storage` if you aren't passing anything), or you can use [MeteorRN's package interface](#package-interface).

### Using Expo Secure Store

This example shows how to use Expo's secure store implementation as Async storage.
Note, that secure storage in both Android and iOS have a low upper size limit of a few megabytes.

```js
import * as SecureStore from 'expo-secure-store';

// ...

Meteor.connect('wss://myapp.meteor.com/websocket', {
  AsyncStorage: {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
  },
});
```

## Basic Usage

```javascript
import Meteor, { Mongo, withTracker } from '@meteorrn/core';

// "mycol" should match the name of the collection on your meteor server,
// or pass null for a local collection
let MyCol = new Mongo.Collection('mycol');

Meteor.connect('wss://myapp.meteor.com/websocket'); // Note the /websocket after your URL

class App extends React.Component {
  render() {
    let { myThing } = this.props;

    return (
      <View>
        <Text>Here is the thing: {myThing.name}</Text>
      </View>
    );
  }
}

let AppContainer = withTracker(() => {
  Meteor.subscribe('myThing');
  let myThing = MyCol.findOne();

  return {
    myThing,
  };
})(App);

export default AppContainer;
```

**Unique Scenarios:**
Running the app on a physical device but want to connect to local development machine? Check out [this issue comment](https://github.com/TheRealNate/meteor-react-native/issues/82#issuecomment-1012867899).

## Companion Packages

The `@meteorrn/core` package has been kept as light as possible. To access more features, you can use companion packages.

Here are some examples:

- `@meteorrn/oauth-google`: Allows you to let users login to your app with Google
- `@meteorrn/oauth-facebook`: Allows you to let users login to your app with Facebook

For the full list of officially recognized packages,
check out [the @meteorrn github org](https://github.com/meteorrn).

## Compatibility

This package is compatible with React Native versions from 0.60.0 to latest (0.63.2)

For React Native <0.60.0 use [react-native-meteor](https://github.com/inProgress-team/react-native-meteor).

**Migrating from `react-native-meteor`:**

- cursoredFind is no longer an option. All .find() calls will return cursors (to match Meteor)
- `MeteorListView` & `MeteorComplexListView` have been removed
- `CollectionFS` has been removed
- `createContainer` has been removed
- Mixins (`connectMeteor`) have been removed
- `composeWithTracker` has been removed

## Using on Web

While this package was designed with React Native in mind, it is also capable of running on web (using `react-dom`). This can be useful if you need a light-weight Meteor implementation, if you want to create a client app separate from your server codebase, etc. The only change required is providing an AsyncStorage implementation. Here is a simple example:

```js
const AsyncStorage = {
    setItem:async (key, value) => window.localStorage.setItem(key, value),
    getItem:async (key) => window.localStorage.getItem(key)
    removeItem:async (key) => window.localStorage.removeItem(key)
}

Meteor.connect("wss://.../websock", {AsyncStorage});
```

## Changelog

The [GitHub Releases Tab](https://github.com/TheRealNate/meteor-react-native/releases) includes a full changelog

## Package Interface

To ensure that MeteorRN companion packages use the same versions of external packages like AsyncStorage as the core,
`@meteorrn/core` provides a package interface, where companion packages can access certain packages.
Currently, package interface returns an object with the following properties:

- AsyncStorage

### Usage of the package interface

```js
import Meteor from '@meteorrn/core';

const { AsyncStorage } = Meteor.packageInterface();
```

### Differences from Meteor Core to Note:

- This API does not implement `observeChanges` (but it does implement `observe`)

## Advanced topics

### Logging library internals

The library includes several internal classes and constructs, 
that are mostly operate on their own and without user's influence.

Debugging the library working as expected requires listening to several events.
The following shows several events that allow for detailed logging and inspection.

> The logging can be useful for analysis and instrumentation of production apps
> where no console access is possible

#### Data level events (high level)

The most convenient way to track internals is via `Data.onChange`:

```js
const Data = Meteor.getData();
data.onChange(event => console.debug(event));
```

Under the hood this does:

```js
this.db.on('change', cb);
this.ddp.on('connected', cb);
this.ddp.on('disconnected', cb);
this.on('loggingIn', cb);
this.on('loggingOut', cb);
this.on('change', cb);
```

You can also listen on `loggingIn`, `loggingOut`, `onLogin`, `onLoginFailure`
and `change` individually:

```js
const Data = Meteor.getData();
Data.on('loggingIn', (e) => console.debug('loggingIn', e));
// ...
```

#### DDP events (high-level)

```js
const events = [
  // connection messages
  'connected',
  'disconnected',
  // Subscription messages (Meteor Publications)
  'ready',
  'nosub',
  'added',
  'changed',
  'removed',
  // Method messages (Meteor Methods)
  'result',
  'updated',
  // Error messages
  'error',
];
const Data = Meteor.getData();
events.forEach((eventName) => {
  Data.ddp.on(eventName, (event) => console.debug(eventName, event));
});
```

#### Websocket events (low-level)

The library attempts to use the native Websocket, provided by ReactNative.
With the following events you can hook into the low-level messaging with the server:

- `open` - the Websocket successfully opens
- `close` - the Websocket successfully closes
- `message:out` - a message is sent to the server
- `message:in` - a message comes in from the server
- `error` - an error occurred on the Websocket level

```js
const Data = Meteor.getData();
const socket = Data.ddp.socket; 
const events = ['open', 'close', 'message:out', 'message:in', 'error'];
events.forEach(eventName => {
  socket.on(eventName, event => console.debug(eventName, event));
});
```

#### Raw Websocket (lowest-level)

There is the possibility to hook into Websocket one level lower by accessing the 
raw socket.

> This is highly discouraged for production, use at your own risk!
> Note, that Data.ddp.socket listens to some of these already (e.g. error)
> and bubbles them up but also handles cleanup and garbage collection properly.
> Raw socket errors will have the `isRaw` property set to `true`.

```js
const Data = Meteor.getData();
const rawSocket = Data.ddp.socket.rawSocket; 
rawSocket.onopen = (e) => console.debug('raw open', e)
rawSocket.onmessage = (e) => console.debug('raw message', e)
rawSocket.onclose = (e) => console.debug('raw close', e)
rawSocket.onerror = (e) => console.debug('raw error', e)
```

#### Minimongo (low-level)

You can hook into DB events from minimongo directly:
```js
const Data = Meteor.getData();
Data.db.on('change', )
```

### Send logs and errors to the server and external services

While Meteor relies on Websocket connections and DDP as protocol,
you might want sometimes to send data over HTTP.

The following example provides an easy way to listen to errors and send them
to a service via `fetch` request:

```js
// in your App code
const errorToBody = err => {
  const errProps = Object.getOwnPropertyNames(err) ;
  const formBody = [];
  for (const prop of errProps) {
    const encodedKey = encodeURIComponent(prop);
    const encodedValue = encodeURIComponent(err[prop]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  return formBody.join("&");
}

const sendError = err => {
  fetch('https://mydomain.tld/log/error', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: errToBody(err)
  })
  .then(console.debug)
  .catch(console.error)
}

// hook into all DDP and socket-level errors
const Data = Meteor.getData();
Data.dpp.on('error', e => {
  const error = e instanceof Error ? e : e?.error;
  return error && sendError(error);
});
```

#### Accounts

## Showcase

| Whazzup.co                                                                                                                                    | StarlingRealtime                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://user-images.githubusercontent.com/16267331/120551863-84907c80-c3c4-11eb-8e32-39b950b67875.png" height="200" align="center"> | <img src="https://uploads-ssl.webflow.com/5f112aac57df16c9ac9c21e0/5f11b8a2e5a66ea03a1a9835_android-chrome-512x512%20copy.png" height="200" align="center"> |
| [Whazzup.co](https://whazzup.co/) uses Meteor React Native in their native app                                                                | [StarlingRealtime](https://www.starlingrealtime.com/) uses Meteor React Native in their production app                                                      |

| lea.online                                                                                                                                            | Your app here!                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| <img src="https://avatars.githubusercontent.com/u/48286741?s=250&v=4" height="200" align="center">                                                    | <img src="https://avatars.githubusercontent.com/u/789528?s=200&v=4" height="200" align="center"> |
| [lea.online](https://github.com/leaonline) uses Meteor React Native in their [native mobile learning app](https://github.com/leaonline/leaonline-app) | **Show us your app that uses this library!**                                                     |

## Contribution and maintenance

Meteor React Native is maintained by [Jan Küster](https://github.com/jankapunkt)
and was formerly maintained by [Nathaniel Dsouza](github.com/therealnate)
who is available for consultation: nate@notaiyet.io

> We appreciate any contributions to this project!

If you have an issue, a question or want to discuss things, then use our [issue link](https://github.com/meteorrn/meteor-react-native/issues/new/choose) that will help you find the
right spot to ask or tell.

If you want to contribute code, then please, make sure you have read our [contribution guide](./CONTRIBUTING.md) and our
[code of conduct](./CODE_OF_CONDUCT.md).

You can [ask us anytime](https://github.com/meteorrn/meteor-react-native/discussions/categories/q-a), if you get stuck or any of these documents are unclear to you.

## License

MIT, see [license file](./LICENSE)
