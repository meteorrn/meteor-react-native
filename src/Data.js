import minimongo from 'minimongo-cache';
import Tracker from './Tracker.js';
import {
  batchedUpdates,
  runAfterInteractions,
} from '../helpers/reactNativeBindings';

const db = new minimongo();
db.debug = false;
db.batchedUpdates = batchedUpdates;
process.nextTick = setImmediate;
afterInteractions = runAfterInteractions;

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
    setTimeout(() => {
      this._cbs.map(cb => {
        if (cb.eventName == eventName && typeof cb.callback == 'function') {
          cb.callback();
        }
      });
    }, 1);
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
