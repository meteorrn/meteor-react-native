# Local

This package allows you to store your data locally (similar to GroundDB for Meteor Web). 

This package introduces the `Local.Collection`, which will mirror the specified remote collection, and store all documents on the device, making your data offline.

### Caveats
- This package (currently) works by creating a second local Mongo Collection. This means you are esentially keeping two copies of each document (that you store locally) in memory. This issue can be mitigated by keeping an "age" or "version" on all your documents, and only publishing documents that have been changed from local
- This package (currently) does not support the removal of documents. Once a document has been inserted into the local database, it is there forever (unless you manually call `remove` on the Local.Collection)
- Performing `.insert`, `.update`, `.remove`, etc on a Local.Collection only makes those modifications to the in-memory minimongo. Those changes won't be sent to the server, and those changes (currently) dont trigger the saving procedure, so they will not be committed to the disk (unless a remote change is made afterwards)

### Usage:

````
import Local from '@meteorrn/local';

const MyLocalCollection = new Local.Collection("name");

MyLocalCollection.find().fetch()
````

You should use LocalCollection whenever you want to access the stored data. The Local Collection will observe the live collection and automatically update when the live collection does.

### API Docs

#### Collection(name, options)
Creates a Local Collection that mirrors changes to collection with specified name. 

**Options:**

*disableDateParser (default: false):* Disables the default behavior when parsing the stringified collection of automatically converting date strings into JS dates

### Compatability
This package takes advantage of observe and local collections, added in `@meteorrn/core@2.0.8`.
