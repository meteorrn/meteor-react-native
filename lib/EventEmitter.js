let eventEmitter;

try {
  const { NativeEventEmitter } = require('react-native');
  console.debug(NativeEventEmitter)
  eventEmitter = NativeEventEmitter
  eventEmitter.on = eventEmitter.addListener;
  eventEmitter.off = eventEmitter.removeListener;
} catch (e) {
  // on test we fall back to events,
  // usually provided by the node environment
  eventEmitter = require('events').EventEmitter;
}

module.exports = eventEmitter;
