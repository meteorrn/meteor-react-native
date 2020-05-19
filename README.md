# meteor-react-native
Connect React Native to your Meteor app. Based on [react-native-meteor](https://github.com/inProgress-team/react-native-meteor), and compatible with the latest version of React Native.

[API Documentation](/docs/api.md)

You can view a guide to using React Native with Meteor on the [Official Meteor Guide](https://guide.meteor.com/react-native.html)

# Installation
1. `npm install --save meteor-react-native`
2. Confirm you have peer dependencty `@react-native-community/netinfo` installed
3. Confirm you have `@react-native-community/async-storage@>=1.8.1` installed. If you are using Expo, or otherwise cannot use `@react-native-community/async-storage`, see *Custom Storage Adapter* below.


### Custom Storage Adapter
To use a custom AsyncStorage implementation, pass it as an option in `Meteor.connect`:

```javascript
import { AsyncStorage } from 'react-native';

// ...

Meteor.connect("wss://myapp.meteor.com/websocket", { AsyncStorage });
```

# Basic Usage

```javascript
import Meteor, { Mongo, withTracker } from 'meteor-react-native';

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
