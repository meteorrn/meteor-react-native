# Meteor React Native
Connect React Native to your Meteor app. Based on [react-native-meteor](https://github.com/inProgress-team/react-native-meteor), and compatible with the latest version of React Native.

[API Documentation](/docs/api.md)

You can view a guide to using React Native with Meteor on the [Official Meteor Guide](https://guide.meteor.com/react-native.html)

# New Package Name
Meteor React Native is now published under `@meteorrn/core`. We will continue to publish updates to the `meteor-react-native` repository until `2.1.0`. We recommend updating to the new package name as soon as possible.

# Installation
1. `npm install --save @meteorrn/core`
2. Confirm you have peer dependencty `@react-native-community/netinfo` installed
3. Confirm you have `@react-native-community/async-storage@>=1.8.1` installed. If you are using Expo, or otherwise cannot use `@react-native-community/async-storage`, see *Custom Storage Adapter* below.


### Custom Storage Adapter
This package uses `@react-native-community/async-storage` by default. This may cause issues if you are using certain React Native versions, or if you are using Expo. To use a custom AsyncStorage implementation, pass it as an option in `Meteor.connect`:

```javascript
import { AsyncStorage } from 'react-native';

// ...

Meteor.connect("wss://myapp.meteor.com/websocket", { AsyncStorage });
```

# Basic Usage

```javascript
import Meteor, { Mongo, withTracker } from '@meteorrn/core';

let MyCol = new Mongo.Collection("mycol");

Meteor.connect("wss://myapp.meteor.com/websocket"); // Note the /websocket after your URL 

class App extends React.Component {
    render() {
        let {myThing} = this.props;
        
        return (
            <View>
                <Text>Here is the thing: {myThing.name}</Text>
            </View>
        );
    } 
}

let AppContainer = withTracker(() => {
    Meteor.subscribe("myThing");
    let myThing = MyCol.findOne();
    
    return {
        myThing
    };
})(App)

export default AppContainer;
```

# Companion Packages

There are a few official companion packages available to add new features. Some packages provide a polyfill for Atmosphere packages, others simplify your app's integration with Native features (like local data storage).

Beta Packages:
- [`@meteorrn/ndev-mfa`](/companion-packages/meteorrn-ndev-mfa): Package that allows your RN app to work with `meteor/ndev:mfa`
- [`@meteorrn/local`](/companion-packages/meteorrn-local): Package for storing of data locally that works seamlessly with MeteorRN by injecting data into a local minimongo collection

Planned/Upcoming Packages:
- `@meteorrn/queued-calls`: Package that allows you to queue Meteor calls that will be performed when internet/server is available

If you have an idea for a companion package, please open an issue. If you would like to publish your own companion package, we recommend a package name with the prefix `mrn-`.

# Compatibility
For React Native >=0.60.0 use this package

For React Native <0.60.0 use [react-native-meteor](https://github.com/inProgress-team/react-native-meteor).

**Migrating from `react-native-meteor`:**
- cursoredFind is no longer an option. All .find() calls will return cursors (to match Meteor)
- `MeteorListView` & `MeteorComplexListView` have been removed
- `CollectionFS` has been removed
- `createContainer` has been removed
- Mixins (`connectMeteor`) have been removed
- `composeWithTracker` has been removed

# Changelog
The [GitHub Releases Tab](https://github.com/TheRealNate/meteor-react-native/releases) includes a full changelog
