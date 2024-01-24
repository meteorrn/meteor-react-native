# useCachedTracker

This is a locally cached version `useCachedTracker` wrapped around the well known `useTracker`. 

## Usage

```javascript
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