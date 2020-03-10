# Connect your components

The `withTracker` function now replaces the previous function `createContainer`, however it remains as part of the package for backwards compatibility.

## withTracker

A HOC function, which allows you to create a container component which provides data to your presentational components.

### Example

```javascript
import Meteor, { withTracker } from 'react-native-meteor';


class Orders extends Component {
  render() {
    const { pendingOrders } = this.props;

    //...
    );
  }
}

export default withTracker(params => {
  return {
    pendingOrders: Meteor.collection('orders').find({ status: "pending" }),
  };
})(Orders);
```
