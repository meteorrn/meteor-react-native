# MeteorRN Local

Store data locally. 

**This package is experimental. There are a lot of caveats to using it. You should check the list below before using in production.**

### Caveats
- This package (currently) works by creating a second local Mongo Collection. This means you are esentially keeping two copies of each document (that you store locally) in memory. This issue can be mitigated by keeping an "age" or "version" on all your documents, and only publishing documents that have been changed from local
- This package (currently) does not support the removal of documents. Once a document has been inserted into the local database, it is there forever (unless you manually `.remove` it)
- This package changes JSON parse behavior by automatically detecting stringified dates (`/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/`) and converting them into JS dates. If this is a problem

Usage:

````
const MyLocalCollection = new Local.Collection("name");

MyLocalCollection.find().fetch()
````

You should use LocalCollection whenever you want to access the stored data. The Local Collection will observe the live collection and automatically update when the live collection does.

### Options (`new Local.Collection("...name...", options)`)

#### disableDateParser (default: false)
Disables the default behavior when parsing the stringified collection of automatically converting date strings into JS dates

### Compatability
This package takes advantage of observe and local collections, added in `@meteorrn/core@2.0.8`.