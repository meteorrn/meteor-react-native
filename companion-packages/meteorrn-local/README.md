# Local

This package allows you to store your data locally (similar to GroundDB for Meteor Web).

This package introduces the `Local.Collection`, which will mirror the specified remote collection, and store all documents on the device, making your data offline.

### Caveats

- This package (currently) works by creating a second local Mongo Collection. This means you are esentially keeping two copies of each document (that you store locally) in memory. This issue can be mitigated by keeping an "age" or "version" on all your documents, and only publishing documents that have been changed from local
- This package (currently) does not support the automatic removal/expiry of documents. Once a document has been inserted into the local database, it is there forever (unless you manually call `remove` on the Local.Collection)

### Usage:

```
import Local from '@meteorrn/local';

const MyLocalCollection = new Local.Collection("name");

MyLocalCollection.find().fetch()
```

You should use LocalCollection whenever you want to access the stored data. The Local Collection will observe the live collection and automatically update when the live collection does.

### Data Loading:

A `Local.Collection` exposes a property called `loadPromise` which resolves once local data has been loaded into the collection. You can use this to control loading flow, like so:

```
const Todos = new Local.Collection("todos");

class Home extends React.Component {
  state = {dataLoading:true};

  componentDidMount() {
    Todos.loadPromise.then(() => {
      this.setState({dataLoading:false});
    }).catch(e => {
      // Uh oh, an error loading the data.
    });
  }
}
```

### Data Grouping

By default, this package stores each collection in its own AsyncStorage field. If you plan to store very large amounts of data in a collection, consider grouping the data. When you specify a certain field, data will be grouped on this field and stored in separate AsyncStorage fields. If you specify a `limit`, the limit will be applied to individual groups instead of the collection as a whole.

### API Docs

#### Collection(name, options)

Creates a Local Collection that mirrors changes to collection with specified name.

**Options:**

_groupBy (default: null):_ Specifies a field to organize items on. Items will be grouped into separate AsyncStorage keys by specified limit. If you specifiy a limit, the limit will be applied to each group instead of the collection as a whole

_limit (default: -1):_ Specifies a limit to the number of documents to store. The sort property is required to use this.

_sort (default: null):_ Specifies a sort method to maintain documents by

_disableDateParser (default: false):_ Disables the default behavior when parsing the stringified collection of automatically converting date strings into JS dates

**Properties:**
A `Local.Collection` is a local Mongo Collection that exposes the following additional properties

_loadPromise (Promise):_ A promise that resolves when the local data has been inserted into the collection. While this will typically only take a few hundred milliseconds, if you have UI that depends on the local data, you may want to use this promise in your loading flow.

### Compatability

This package takes advantage of observe and local collections, added in `@meteorrn/core@2.0.8`.
