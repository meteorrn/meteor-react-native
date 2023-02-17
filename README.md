# Meteor React Native

A set of packages allowing you to connect your React Native app to your Meteor server, and take advantage of Meteor-specific features like accounts, reactive data trackers, etc. Compatible with the latest version of React Native.

[![Node.js CI](https://github.com/meteorrn/meteor-react-native/actions/workflows/node.js.yml/badge.svg)](https://github.com/meteorrn/meteor-react-native/actions/workflows/node.js.yml)
[![CodeQL](https://github.com/meteorrn/meteor-react-native/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/meteorrn/meteor-react-native/actions/workflows/codeql-analysis.yml)
![npm](https://img.shields.io/npm/dm/@meteorrn/core)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Check out [the @meteorrn github org](https://github.com/meteorrn) for more packages, examples, and tutorials.

[Full API Documentation](/docs/api.md)

If you're new to React Native, you can view a guide to using React Native with Meteor on the [Official Meteor Guide](https://guide.meteor.com/react-native.html)

# Installation

1.  `npm install --save @meteorrn/core`
2.  Confirm you have peer dependencty `@react-native-community/netinfo` installed
3.  Confirm you have `@react-native-async-storage/async-storage@>=1.8.1` installed. If you are using Expo, or otherwise cannot use `@react-native-async-storage/async-storage`, see _Custom Storage Adapter_ below.

<h3 id="custom-storage-adapter">A note on AsyncStorage</h3>
This package uses `@react-native-async-storage/async-storage` by default. This may cause issues if you are using certain React Native versions, or if you are using Expo. To use a custom AsyncStorage implementation, pass it as an option in `Meteor.connect`:

```javascript
import { AsyncStorage } from 'react-native';

// ...

Meteor.connect('wss://myapp.meteor.com/websocket', { AsyncStorage });
```

If you are using the `AsyncStorage` API yourself, its important that you use the same version that MeteorRN is using, or issues could be caused due to the conflicting versions. Make sure you are using the same AsyncStorage you pass into Meteor (or `@react-native-async-storage/async-storage` if you aren't passing anything), or you can use [MeteorRN's package interface](#package-interface).

# Basic Usage

```javascript
import Meteor, { Mongo, withTracker } from '@meteorrn/core';

// "mycol" should match the name of the collection on your meteor server, or pass null for a local collection
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

# Companion Packages

The `@meteorrn/core` package has been kept as light as possible. To access more features, you can use companion packages.

Here are some examples:

* `@meteorrn/oauth-google`: Allows you to let users login to your app with Google
* `@meteorrn/oauth-facebook`: Allows you to let users login to your app with Facebook

For the full list of officially recognized packages, check out [the @meteorrn github org](https://github.com/meteorrn).

# Compatibility

This package is compatible with React Native versions from 0.60.0 to latest (0.63.2)

For React Native <0.60.0 use [react-native-meteor](https://github.com/inProgress-team/react-native-meteor).

**Migrating from `react-native-meteor`:**

* cursoredFind is no longer an option. All .find() calls will return cursors (to match Meteor)
* `MeteorListView` & `MeteorComplexListView` have been removed
* `CollectionFS` has been removed
* `createContainer` has been removed
* Mixins (`connectMeteor`) have been removed
* `composeWithTracker` has been removed

# Using on Web

While this package was designed with React Native in mind, it is also capable of running on web (using `react-dom`). This can be useful if you need a light-weight Meteor implementation, if you want to create a client app separate from your server codebase, etc. The only change required is providing an AsyncStorage implementation. Here is a simple example:

```
const AsyncStorage = {
    setItem:async (key, value) => window.localStorage.setItem(key, value),
    getItem:async (key) => window.localStorage.getItem(key)
    removeItem:async (key) => window.localStorage.removeItem(key)
}

Meteor.connect("wss://.../websock", {AsyncStorage});
```

# Changelog

The [GitHub Releases Tab](https://github.com/TheRealNate/meteor-react-native/releases) includes a full changelog

# Package Interface

To ensure that MeteorRN companion packages use the same versions of external packages like AsyncStorage as the core, `@meteorrn/core` provides a package interface, where companion packages can access certain packages. Currently package interface returns an object with the following properties:

* AsyncStorage

### Usage

```
import Meteor from '@meteorrn/core';

const {AsyncStorage} = Meteor.packageInterface();
```

### Differences from Meteor Core to Note:

* This API does not implement `observeChanges` (but it does implement `observe`)

# Showcase

| Whazzup.co                                                                                                                                    | StarlingRealtime                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://user-images.githubusercontent.com/16267331/120551863-84907c80-c3c4-11eb-8e32-39b950b67875.png" height="250" align="center"> | <img src="https://uploads-ssl.webflow.com/5f112aac57df16c9ac9c21e0/5f11b8a2e5a66ea03a1a9835_android-chrome-512x512%20copy.png" height="250" align="center"> |
| [Whazzup.co](https://whazzup.co/) uses Meteor React Native in their native app                                                                | [StarlingRealtime](https://www.starlingrealtime.com/) uses Meteor React Native in their production app                                                      |

<hr/>

Meteor React Native is maintained by [Nathaniel Dsouza](github.com/therealnate) who is available for consultation: nate@hiyllo.com
