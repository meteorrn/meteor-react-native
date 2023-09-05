let eventEmitter;

try {
  const { NativeEventEmitter } = require('react-native');
  eventEmitter = NativeEventEmitter
  eventEmitter.prototype.on = eventEmitter.prototype.addListener;
  eventEmitter.prototype.off = eventEmitter.prototype.removeListener;
} catch (e) {
  // on test we fall back to events,
  // usually provided by the node environment
  eventEmitter = require('events').EventEmitter;
}

module.exports = eventEmitter;
