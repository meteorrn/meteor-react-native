import Tracker from './Tracker.js';
import EJSON from 'ejson';
import DDP from '../lib/ddp.js';
import Random from '../lib/Random';

import Data from './Data';
import Mongo from './Mongo';
import { Collection, getObservers, localCollections } from './Collection';
import call from './Call';

import withTracker from './components/withTracker';
import useTracker from './components/useTracker';

import ReactiveDict from './ReactiveDict';

let isVerbose = false;

const Meteor = {
  isVerbose,
  enableVerbose() {
    isVerbose = true;
  },
  _reactiveDict: new ReactiveDict(),
  Random,
  Mongo,
  Tracker,
  EJSON,
  ReactiveDict,
  Collection,
  collection() {
    throw new Error('Meteor.collection is deprecated. Use Mongo.Collection');
  },
  withTracker,
  useTracker,
  getData() {
    return Data;
  },
  status() {
    return {
      connected: !!this._reactiveDict.get('connected'),
      status: Data.ddp ? Data.ddp.status : 'disconnected',
      //retryCount: 0
      //retryTime:
      //reason:
    };
  },
  call: call,
  disconnect() {
    if (Data.ddp) {
      Data.ddp.disconnect();
    }
  },
  _subscriptionsRestart() {
    for (var i in Data.subscriptions) {
      const sub = Data.subscriptions[i];
      Data.ddp.unsub(sub.subIdRemember);
      sub.subIdRemember = Data.ddp.sub(sub.name, sub.params);
    }
  },
  waitDdpConnected: Data.waitDdpConnected.bind(Data),
  reconnect() {
    Data.ddp && Data.ddp.connect();
  },
  packageInterface: () => {
    return {
      AsyncStorage:
        Data._options.AsyncStorage ||
        require('@react-native-community/async-storage').default,
    };
  },
  connect(endpoint, options) {
    if (!endpoint) endpoint = Data._endpoint;
    if (!options) options = Data._options;

    if (
      (!endpoint.startsWith('ws') || !endpoint.endsWith('/websocket')) &&
      !options.suppressUrlErrors
    ) {
      throw new Error(
        `Your url "${endpoint}" may be in the wrong format. It should start with "ws://" or "wss://" and end with "/websocket", e.g. "wss://myapp.meteor.com/websocket". To disable this warning, connect with option "suppressUrlErrors" as true, e.g. Meteor.connect("${endpoint}", {suppressUrlErrors:true});`
      );
    }

    if (!options.AsyncStorage) {
      const AsyncStorage = require('@react-native-community/async-storage')
        .default;

      if (AsyncStorage) {
        options.AsyncStorage = AsyncStorage;
      } else {
        throw new Error(
          'No AsyncStorage detected. Import an AsyncStorage package and add to `options` in the Meteor.connect() method'
        );
      }
    }

    Data._endpoint = endpoint;
    Data._options = options;

    this.ddp = Data.ddp = new DDP({
      endpoint: endpoint,
      SocketConstructor: WebSocket,
      ...options,
    });

    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      NetInfo.addEventListener(
        ({ type, isConnected, isInternetReachable, isWifiEnabled }) => {
          if (isConnected && Data.ddp.autoReconnect) {
            Data.ddp.connect();
          }
        }
      );

      NetInfo.fetch().then(
        ({ type, isConnected, isInternetReachable, isWifiEnabled }) => {
          if (isConnected && Data.ddp.autoReconnect) {
            Data.ddp.connect();
          }
        }
      );
    } catch (e) {
      console.warn(
        'Warning: NetInfo not installed, so DDP will not automatically reconnect'
      );
    }

    Data.ddp.on('connected', () => {
      // Clear the collections of any stale data in case this is a reconnect
      if (Data.db && Data.db.collections) {
        for (var collection in Data.db.collections) {
          if (!localCollections.includes(collection)) {
            // Dont clear data from local collections
            Data.db[collection].remove({});
          }
        }
      }

      if (isVerbose) {
        console.info('Connected to DDP server.');
      }
      this._loadInitialUser().then(() => {
        this._subscriptionsRestart();
      });
      this._reactiveDict.set('connected', true);
      this.connected = true;
      Data.notify('change');
    });

    let lastDisconnect = null;
    Data.ddp.on('disconnected', () => {
      this.connected = false;
      this._reactiveDict.set('connected', false);

      Data.notify('change');

      if (isVerbose) {
        console.info('Disconnected from DDP server.');
      }

      if (!Data.ddp.autoReconnect) return;

      if (!lastDisconnect || new Date() - lastDisconnect > 3000) {
        Data.ddp.connect();
      }

      lastDisconnect = new Date();
    });

    Data.ddp.on('added', message => {
      if (!Data.db[message.collection]) {
        Data.db.addCollection(message.collection);
      }
      const document = {
        _id: message.id,
        ...message.fields,
      };

      Data.db[message.collection].upsert(document);
      let observers = getObservers('added', message.collection, document);
      observers.forEach(callback => {
        try {
          callback(document, null);
        } catch (e) {
          console.error('Error in observe callback', e);
        }
      });
    });

    Data.ddp.on('ready', message => {
      const idsMap = new Map();
      for (var i in Data.subscriptions) {
        const sub = Data.subscriptions[i];
        idsMap.set(sub.subIdRemember, sub.id);
      }
      for (var i in message.subs) {
        const subId = idsMap.get(message.subs[i]);
        if (subId) {
          const sub = Data.subscriptions[subId];
          sub.ready = true;
          sub.readyDeps.changed();
          sub.readyCallback && sub.readyCallback();
        }
      }
    });

    Data.ddp.on('changed', message => {
      const unset = {};
      if (message.cleared) {
        message.cleared.forEach(field => {
          unset[field] = null;
        });
      }

      if (Data.db[message.collection]) {
        const document = {
          _id: message.id,
          ...message.fields,
          ...unset,
        };

        const oldDocument = Data.db[message.collection].findOne({
          _id: message.id,
        });

        Data.db[message.collection].upsert(document);
        let observers = getObservers('changed', message.collection, document);
        observers.forEach(callback => {
          try {
            callback(document, oldDocument);
          } catch (e) {
            console.error('Error in observe callback', e);
          }
        });
      }
    });

    Data.ddp.on('removed', message => {
      if (Data.db[message.collection]) {
        const oldDocument = Data.db[message.collection].findOne({
          _id: message.id,
        });
        let observers = getObservers(
          'removed',
          message.collection,
          oldDocument
        );
        Data.db[message.collection].del(message.id);
        observers.forEach(callback => {
          try {
            callback(null, oldDocument);
          } catch (e) {
            console.error('Error in observe callback', e);
          }
        });
      }
    });
    Data.ddp.on('result', message => {
      const call = Data.calls.find(call => call.id == message.id);
      if (typeof call.callback == 'function')
        call.callback(message.error, message.result);
      Data.calls.splice(Data.calls.findIndex(call => call.id == message.id), 1);
    });

    Data.ddp.on('nosub', message => {
      for (var i in Data.subscriptions) {
        const sub = Data.subscriptions[i];
        if (sub.subIdRemember == message.id) {
          console.warn('No subscription existing for', sub.name);
        }
      }
    });
    Data.ddp.on('error', message => {
      console.warn(message);
    });
  },
  subscribe(name) {
    let params = Array.prototype.slice.call(arguments, 1);
    let callbacks = {};
    if (params.length) {
      let lastParam = params[params.length - 1];
      if (typeof lastParam == 'function') {
        callbacks.onReady = params.pop();
      } else if (
        lastParam &&
        (typeof lastParam.onReady == 'function' ||
          typeof lastParam.onError == 'function' ||
          typeof lastParam.onStop == 'function')
      ) {
        callbacks = params.pop();
      }
    }

    // Is there an existing sub with the same name and param, run in an
    // invalidated Computation? This will happen if we are rerunning an
    // existing computation.
    //
    // For example, consider a rerun of:
    //
    //     Tracker.autorun(function () {
    //       Meteor.subscribe("foo", Session.get("foo"));
    //       Meteor.subscribe("bar", Session.get("bar"));
    //     });
    //
    // If "foo" has changed but "bar" has not, we will match the "bar"
    // subcribe to an existing inactive subscription in order to not
    // unsub and resub the subscription unnecessarily.
    //
    // We only look for one such sub; if there are N apparently-identical subs
    // being invalidated, we will require N matching subscribe calls to keep
    // them all active.

    let existing = false;
    for (let i in Data.subscriptions) {
      const sub = Data.subscriptions[i];
      if (sub.inactive && sub.name === name && EJSON.equals(sub.params, params))
        existing = sub;
    }

    let id;
    if (existing) {
      id = existing.id;
      existing.inactive = false;

      if (callbacks.onReady) {
        // If the sub is not already ready, replace any ready callback with the
        // one provided now. (It's not really clear what users would expect for
        // an onReady callback inside an autorun; the semantics we provide is
        // that at the time the sub first becomes ready, we call the last
        // onReady callback provided, if any.)
        if (!existing.ready) existing.readyCallback = callbacks.onReady;
      }
      if (callbacks.onStop) {
        existing.stopCallback = callbacks.onStop;
      }
    } else {
      // New sub! Generate an id, save it locally, and send message.

      id = Random.id();
      const subIdRemember = Data.ddp.sub(name, params);

      Data.subscriptions[id] = {
        id: id,
        subIdRemember: subIdRemember,
        name: name,
        params: EJSON.clone(params),
        inactive: false,
        ready: false,
        readyDeps: new Tracker.Dependency(),
        readyCallback: callbacks.onReady,
        stopCallback: callbacks.onStop,
        stop: function() {
          Data.ddp.unsub(this.subIdRemember);
          delete Data.subscriptions[this.id];
          this.ready && this.readyDeps.changed();

          if (callbacks.onStop) {
            callbacks.onStop();
          }
        },
      };
    }

    // return a handle to the application.
    var handle = {
      stop: function() {
        if (Data.subscriptions[id]) Data.subscriptions[id].stop();
      },
      ready: function() {
        if (!Data.subscriptions[id]) return false;

        let record = Data.subscriptions[id];
        record.readyDeps.depend();
        return record.ready;
      },
      subscriptionId: id,
    };

    if (Tracker.active) {
      // We're in a reactive computation, so we'd like to unsubscribe when the
      // computation is invalidated... but not if the rerun just re-subscribes
      // to the same subscription!  When a rerun happens, we use onInvalidate
      // as a change to mark the subscription "inactive" so that it can
      // be reused from the rerun.  If it isn't reused, it's killed from
      // an afterFlush.
      Tracker.onInvalidate(function(c) {
        if (Data.subscriptions[id]) {
          Data.subscriptions[id].inactive = true;
        }

        Tracker.afterFlush(function() {
          if (Data.subscriptions[id] && Data.subscriptions[id].inactive) {
            handle.stop();
          }
        });
      });
    } else {
      if (Data.subscriptions[id]) {
        Data.subscriptions[id].inactive = true;
      }
    }

    return handle;
  },
};

export default Meteor;
