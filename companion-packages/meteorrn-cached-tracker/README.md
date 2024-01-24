# useCachedTracker

This is a locally cached version `useCachedTracker` wrapped around the well known `useTracker`. 

## Usage

The first argument is the computation, second is the dependency array. You do the subscriptions outside the tracker and
provide a parameter (here it's `subReady`) to inform the tracker when the subscription providing your data is ready or not.
Finally you add a parameter (here `!connecteed`) that indicates, when the stored results should be fetched from the local storage cache.

```js
const {
    data: { messages },
    ready,
  } = useCachedTracker(
    () => {
      if (!user) return { messages: [] };

      const messages = VMessage.find(
        { _userId: user._id },
        { sort: { _createdAt: -1 }, limit: 50 }
      ).fetch();

      return { messages };
    },
    [user._id],
    subReady,
    !connected
  );
  ```