import EventEmitter from 'wolfy87-eventemitter';
import Queue from './queue';
import Socket from './socket';
import { uniqueId } from './utils';

const DDP_VERSION = '1';
const PUBLIC_EVENTS = [
  'connected',
  'disconnected',
  // Subscription messages
  'ready',
  'nosub',
  'added',
  'changed',
  'removed',
  // Method messages
  'result',
  'updated',
  // Error messages
  'error',
];
const DEFAULT_RECONNECT_INTERVAL = 10000;

class EventInterface {
  constructor() {
    this.listeners = {};
    PUBLIC_EVENTS.forEach((eventName) => {
      this.listeners[eventName] = {};
    });
  }

  activate(ddp) {
    this.ddp = ddp;
    PUBLIC_EVENTS.forEach((eventName) => {
      this.ddp.addListener(eventName, (event) => {
        this._handleEvent(eventName, event);
      });
    });
  }

  _handleEvent(eventName, event) {
    for (let func of Object.values(this.listeners[eventName])) {
      try {
        func(event);
      } catch (e) {
        console.error(
          '@meteorrn/core failed to call DDP event handler for ' + eventName,
          e
        );
      }
    }
  }

  on(eventName, func) {
    const id = Math.random() + '';
    if (!this.listeners[eventName])
      throw new Error(`Unsupported event name "${eventName}"`);
    this.listeners[eventName][id] = func;
    return { remove: () => delete this.listeners[eventName][id] };
  }
}

const eventInterface = new EventInterface();

export default class DDP extends EventEmitter {
  emit() {
    setTimeout(super.emit.bind(this, ...arguments), 0);
  }

  constructor(options) {
    super();

    this.eventInterface = eventInterface;
    eventInterface.activate(this);

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
        this.messageQueue.process();
        this.emit('connected');
      } else if (message.msg === 'ping') {
        // Reply with a `pong` message to prevent the server from
        // closing the connection
        this.socket.send({ msg: 'pong', id: message.id });
      } else if (PUBLIC_EVENTS.includes(message.msg)) {
        this.emit(message.msg, message);
      }
    });

    if (this.autoConnect) {
      this.connect();
    }
  }

  connect() {
    this.socket.open();
  }

  disconnect() {
    /*
     *   If `disconnect` is called, the caller likely doesn't want the
     *   the instance to try to auto-reconnect. Therefore we set the
     *   `autoReconnect` flag to false.
     */
    this.autoReconnect = false;
    this.socket.close();
  }

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

  unsub(id) {
    this.messageQueue.push({
      msg: 'unsub',
      id: id,
    });
    return id;
  }
}
