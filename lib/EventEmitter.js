let eventEmitter;

try {
  const { NativeEventEmitter } = require('react-native');
  const EventEmitter = NativeEventEmitter.prototype.constructor

  class MeteorRNEventEmitter extends EventEmitter {
    constructor() {
      super();
    }

    on(...args) {
      return this.addListener(...args);
    }
  }
  eventEmitter = MeteorRNEventEmitter;
} catch (e) {
  // on test we fall back to events,
  // usually provided by the node environment
  eventEmitter = require('events').EventEmitter;
}

module.exports = eventEmitter;
