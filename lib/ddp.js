import EventEmitter from 'eventemitter3';
import Queue from './queue';
import Socket from './socket';
import { uniqueId } from './utils';

/**
 * This is the latest version, of the protocol we use
 * @type {string}
 * @private
 */
const DDP_VERSION = '1';

/**
 * Contains all public events that externals can listen to.
 * @type {string[]}
 * @private
 */
const PUBLIC_EVENTS = [
  // connection messages
  'connected',
  'disconnected',
  // Subscription messages (Meteor Publications)
  'ready',
  'nosub',
  'added',
  'changed',
  'removed',
  // Method messages (Meteor Methods)
  'result',
  'updated',
  // Error messages
  'error',
];

/**
 * The default timout in ms until a reconnection attempt starts
 * @type {number}
 * @private
 */
const DEFAULT_RECONNECT_INTERVAL = 10000;

/**
 * Internal interface for event handling.
 * By default, it adds listeners to all public events
 * and process them in a safe way with a try/catch
 * @private
 */
class EventInterface {
  constructor() {
    this.listeners = {};
    PUBLIC_EVENTS.forEach((eventName) => {
      this.listeners[eventName] = {};
    });
  }

  /**
   * Attaches listeners to all public DDP events.
   * @param ddp
   */
  activate(ddp) {
    this.ddp = ddp;
    PUBLIC_EVENTS.forEach((eventName) => {
      this.ddp.addListener(eventName, (event) => {
        // TODO for silly logging it might be a good place log here
        this._handleEvent(eventName, event);
      });
    });

    return this;
  }

  /**
   * Handles a single event by calling all attached listener functions.
   * @param eventName {string} name of the event to handle
   * @param event {object} the actual event to pass to the callbacks
   * @private
   */
  _handleEvent(eventName, event) {
    for (let func of Object.values(this.listeners[eventName])) {
      try {
        func(event);
      } catch (e) {
        // TODO should we delegate this to the 'error' event listeners?
        //   It would at least make sense, since the
        console.error(
          '@meteorrn/core failed to call DDP event handler for ' + eventName,
          e
        );
      }
    }
  }

  on(eventName, func) {
    // TODO check params
    const id = Math.random() + '';
    if (!this.listeners[eventName])
      throw new Error(`Unsupported event name "${eventName}"`);
    this.listeners[eventName][id] = func;

    // TODO represent by an EventHandle class
    return { remove: () => delete this.listeners[eventName][id] };
  }
}

/**
 * @private
 * @type {EventInterface}
 */
const eventInterface = new EventInterface();

/**
 * Represents a DDP client that interfaces with the Meteor server backend
 * @class
 */
class DDP extends EventEmitter {
  /**
   * Create a new DDP instance and runs the following init procedure:
   *
   * - init event interfaces for this instance
   * - create a new message Queue
   * - instantiates the WebSocket
   * - open websocket and establish DDP protocol messaging
   * - setup close handling for proper garbage collection etc.
   *
   * @constructor
   * @param options {object} constructor options
   * @param options.autoConnect {boolean=} set to true to auto connect
   * @see {Queue} the internal Queue implementation that is used
   * @see {Socket} the internal Socket implementation that is used
   *
   */
  constructor(options) {
    super();

    this.eventInterface = eventInterface.activate(this);
    this.status = 'disconnected';

    // Default `autoConnect` and `autoReconnect` to true
    this.autoConnect = options.autoConnect !== false;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval =
      options.reconnectInterval || DEFAULT_RECONNECT_INTERVAL;

    this.messageQueue = new Queue((message) => {
      if (this.status === 'connected') {
        this.socket.send(message);
        return true;
      } else {
        return false;
      }
    });

    this.socket = new Socket(options.SocketConstructor, options.endpoint);
    this.socket.on('open', () => {
      // When the socket opens, send the `connect` message
      // to establish the DDP connection
      this.socket.send({
        msg: 'connect',
        version: DDP_VERSION,
        support: [DDP_VERSION],
      });
    });

    this.socket.on('close', () => {
      this.status = 'disconnected';
      this.messageQueue.empty();
      this.emit('disconnected');
      if (this.autoReconnect) {
        // Schedule a reconnection
        setTimeout(this.socket.open.bind(this.socket), this.reconnectInterval);
      }
    });

    this.socket.on('message:in', (message) => {
      if (message.msg === 'connected') {
        this.status = 'connected';
        this._lastSessionId = message.session;
        this.messageQueue.process();
        this.emit('connected');
      } else if (message.msg === 'ping') {
        // Reply with a `pong` message to prevent the server from
        // closing the connection
        this.socket.send({ msg: 'pong', id: message.id });
      } else if (PUBLIC_EVENTS.includes(message.msg)) {
        this.emit(message.msg, message);
      } else {
        this.emit('error', {
          error: new Error(`Unexpected message received`),
          message,
        });
      }
    });

    // delegate error event one level up
    this.socket.on('error', (event) => {
      event.isRaw = event.isRaw || false;
      this.emit('error', event);
    });

    if (this.autoConnect) {
      this.connect();
    }
  }

  /**
   * Emits a new event.
   * @override
   */
  emit(...args) {
    Promise.resolve().then(() => super.emit(...args));
    return true;
  }

  /**
   * Initiates the underlying websocket to open the connection
   */
  connect() {
    this.socket.open();
  }

  /**
   * Closes the underlying socket connection.
   * If `disconnect` is called, the caller likely doesn't want
   * the instance to try to auto-reconnect. Therefore, we set the
   * `autoReconnect` flag to false.
   */
  disconnect() {
    this.autoReconnect = false;
    this.socket.close();
  }

  /**
   * Pushes a method to the message queue.
   * This is what happens under the hood when using {Meteor.call}
   *
   * @param name {string} the name of the Meteor Method that is to be called
   * @param params {any} the params to pass, likely an object
   * @returns {string} a unique message id, beginning from 1, counting up for each message
   */
  method(name, params) {
    const id = uniqueId();
    this.messageQueue.push({
      msg: 'method',
      id: id,
      method: name,
      params: params,
    });
    return id;
  }

  /**
   * Subscribes to a Meteor Publication by adding a sub message to the
   * message queue.
   * This is what is called when using {Meteor.subscribe}
   * @param name {string} name of the publication to sub
   * @param params  {any} args, passed to the sub, likely an object
   * @returns {string} a unique message id, beginning from 1, counting up for each message
   */
  sub(name, params) {
    const id = uniqueId();
    this.messageQueue.push({
      msg: 'sub',
      id: id,
      name: name,
      params: params,
    });
    return id;
  }

  /**
   * Subscribes to a Meteor Publication by adding a sub message to the
   * message queue.
   * This is what is called when calling the `stop()` method of a subscription.
   * @param id {string} id of the prior sub message
   * @returns {string} the id of the prior sub message
   */
  unsub(id) {
    this.messageQueue.push({
      msg: 'unsub',
      id: id,
    });
    return id;
  }
}

export default DDP;
