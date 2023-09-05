let eventEmitter;

try {
  const { NativeEventEmitter } = require('react-native');

  class MeteorRNEventEmitter extends NativeEventEmitter {
    constructor(...args) {
      super(...args);
    }

    on(...args) {
      return this.addListener(...args);
    }

    off(...args) {
      return this.removeListener(...args);
    }
  }
  eventEmitter = MeteorRNEventEmitter;
} catch (e) {
  // on test we fall back to events,
  // usually provided by the node environment
  eventEmitter = require('events').EventEmitter;
}

module.exports = eventEmitter;
