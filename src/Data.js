import minimongo from 'minimongo-cache';
import Tracker from './Tracker.js';

const db = new minimongo();
db.debug = false;

const moduleExists = m => {
  try {
    require.resolve(m);
  }
  catch(e) {
    return false;
  }
  return true;
};

let afterInteractions;
if(moduleExists("react-native")) { 
  db.batchedUpdates = require('react-native/Libraries/Renderer/shims/ReactNative').unstable_batchedUpdates;
  process.nextTick = setImmediate;
  afterInteractions = require('react-native').InteractionManager.runAfterInteractions;
}
else {
  // This code allows the package to work on the web, but it causes an issue in Metro <0.59.0, which is hard to upgrade to due to the react native community CLI not supporting it
  /*
  afterInteractions = requestIdleCallback;  
  try {
    db.batchedUpdates = require('react-dom').unstable_batchedUpdates;
  }
  catch(e) {
    console.warn("react-dom isn't installed, so minimongo-cache performance may be reduced");
  }
  */
}

function runAfterOtherComputations(fn) {
  afterInteractions(() => {
    Tracker.afterFlush(() => {
      fn();
    });
  });
}

export default {
  _endpoint: null,
  _options: {},
  ddp: null,
  subscriptions: {},
  db: db,
  calls: [],

  getUrl() {
    return this._endpoint.substring(0, this._endpoint.indexOf('/websocket'));
  },

  waitDdpReady(cb) {
    if (this.ddp) {
      cb();
    } else {
      runAfterOtherComputations(() => {
        this.waitDdpReady(cb);
      });
    }
  },

  _cbs: [],
  onChange(cb) {
    this.db.on('change', cb);
    this.ddp.on('connected', cb);
    this.ddp.on('disconnected', cb);
    this.on('loggingIn', cb);
    this.on('change', cb);
  },
  offChange(cb) {
    this.db.off('change', cb);
    this.ddp.off('connected', cb);
    this.ddp.off('disconnected', cb);
    this.off('loggingIn', cb);
    this.off('change', cb);
  },
  on(eventName, cb) {
    this._cbs.push({
      eventName: eventName,
      callback: cb,
    });
  },
  off(eventName, cb) {
    this._cbs.splice(
      this._cbs.findIndex(
        _cb => _cb.callback == cb && _cb.eventName == eventName
      ),
      1
    );
  },
  notify(eventName) {
    this._cbs.map(cb => {
      if (cb.eventName == eventName && typeof cb.callback == 'function') {
        cb.callback();
      }
    });
  },
  waitDdpConnected(cb) {
    if (this.ddp && this.ddp.status == 'connected') {
      cb();
    } else if (this.ddp) {
      this.ddp.once('connected', cb);
    } else {
      setTimeout(() => {
        this.waitDdpConnected(cb);
      }, 10);
    }
  },
};
