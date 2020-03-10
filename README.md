# react-native-meteor

## Updated version of the react-native-meteor, compatible with React Native 0.60+

**ATTENTION:** In order to shrink the repository, the following changes have been made from the original react-native-meteor library:
- cursoredFind is no longer an option. All .find() calls will return cursors (to match Meteor)
- `MeteorListView` & `MeteorComplexListView` have been removed
- `CollectionFS` has been removed
- `createContained` has been removed
- Mixins (`connectMeteor`) have been removed
