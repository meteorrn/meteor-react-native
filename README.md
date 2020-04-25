# react-native-meteor
react-native-meteor client, updated to be compatible with RN0.60.0+

[API Documentation](/docs/api.md)

# Installation
1. `npm install --save meteor-react-native`
2. Confirm you have peer dependencies installed (`@react-native-community/netinfo` and `@react-native-community/async-storage>=1.8.1`)

# Basic Usage

````
import { Meteor, Mongo, withTracker } from 'meteor-react-native';

let MyCol = new Mongo.Collection("mycol");

Meteor.connect("wss://myapp.meteor.com");

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
````

# Compatability
For React Native >=0.60.0 use this package

For React Native <0.60.0 use [react-native-meteor](https://github.com/inProgress-team/react-native-meteor).

**Migrating from `react-native-meteor`:**
- cursoredFind is no longer an option. All .find() calls will return cursors (to match Meteor)
- `MeteorListView` & `MeteorComplexListView` have been removed
- `CollectionFS` has been removed
- `createContainer` has been removed
- Mixins (`connectMeteor`) have been removed
- `composeWithTracker` has been removed
