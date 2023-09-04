let eventEmitter;

try {
  eventEmitter = require('react-native').NativeEventEmitter;
  eventEmitter.on = eventEmitter.addListener;
  eventEmitter.off = eventEmitter.removeListener;
} catch (e) {
  // on test we fall back to events,
  // usually provided by the node environment
  eventEmitter = require('events').EventEmitter;
}

module.exports = eventEmitter;
