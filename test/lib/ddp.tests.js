import DDP from '../../lib/ddp';
import { WebSocket, Server as SocketServer } from 'mock-socket';
import { expect } from 'chai';

describe('ddp', function() {
  let validOptions;
  let ddp;
  const endpoint = 'ws://localhost:3000/websocket';
  let server;

  before(function() {
    server = new SocketServer(endpoint);
  });

  beforeEach(function() {
    validOptions = {
      SocketConstructor: WebSocket,
      endpoint,
    };
  });

  afterEach(function () {
    if (ddp) {
      ddp.disconnect();
    }
  });

  it('should throw an error if not passed a socketConstructor', function() {
    expect(() => new DDP({})).to.throw('this.SocketConstructor is not a constructor');
  });

  it('should throw an error given no endpoint', function() {
    expect(() => new DDP({
      SocketConstructor: WebSocket,
    })).to.throw('Failed to construct \'WebSocket\': 1 argument required, but only 0 present');
  });

  it('should start in the disconnected state', function() {
    ddp = new DDP(validOptions);
    expect(ddp.status).to.equal('disconnected');
  });

  it('should start with autoreconnect true given no autoReconnect parameter', function() {
    ddp = new DDP(validOptions);
    expect(ddp.autoReconnect).to.equal(true);
  });

  it('should start with autoreconnect false given autoReconnect parameter set to false', function() {
    validOptions.autoReconnect = false;
    ddp = new DDP(validOptions);
    expect(ddp.autoReconnect).to.equal(false);
  });

  it('should start with autoconnect true given no autoConnect parameter', function() {
    ddp = new DDP(validOptions);
    expect(ddp.autoConnect).to.equal(true);
  });

  it('should start with autoconnect false given autoReconnect parameter set to false', function() {
    validOptions.autoConnect = false;
    ddp = new DDP(validOptions);
    expect(ddp.autoConnect).to.equal(false);
  });

  it('opens a socket connection', function (done) {
    validOptions.autoConnect = false;
    ddp = new DDP(validOptions);
    ddp.socket.on('open', () => done());
    ddp.connect();
  });
  it('opens socket only once', function (done) {
    ddp = new DDP(validOptions);

    let count = 0
    ddp.socket.on('open', () => {
      count++
    });

    ddp.connect();
    ddp.connect();
    ddp.connect();
    ddp.connect();
    ddp.connect();
    ddp.connect();

    setTimeout(() => {
      expect(count).to.equal(1);
      done()
    }, 15)
  });

  it('answers endpoint ping with pong messages', function (done) {
    validOptions.autoConnect = false;
    ddp = new DDP(validOptions);
    ddp.connect();

    ddp.socket.on('message:out', message => {
      if (message.msg === 'pong') {
        expect(message.id).to.equal(99);
        done();
      }
    })

    ddp.socket.on('open', () => {
      ddp.socket.emit('message:in', { msg: 'connected' });
      ddp.socket.emit('message:in', { msg: 'ping', id: 99 });
    })
  });
  it('auto-reconnects if socket closed unexpected', function (done) {
    validOptions.autoConnect = false;
    validOptions.autoReconnect = true;
    validOptions.reconnectInterval = 500;
    ddp = new DDP(validOptions);
    let expected = false

    ddp.socket.on('open', () => {
      ddp.socket.emit('message:in', { msg: 'connected' });
    })
    ddp.on('connected', () => {
      if (expected) {
        done()
      }
    })

    ddp.connect();

    setTimeout(() => {
      expected = true;
      ddp.socket.close();
    }, 25)
  });
  it('only receives valid message from rawSocket', function (done) {
    ddp = new DDP(validOptions);

    const validObj = { foo: 'bar' }
    ddp.socket.on('message:in', obj => {
      if (obj.msg) return // ignore the real ones, just check for our foo
      expect(obj).to.deep.equal(validObj);
      done();
    });

    // to be ignored
    server.emit('message', '{"invalid":')

    // should be valid
    server.emit('message', '{"foo":"bar"}')
  })

  describe('events', function () {
    it('emits custom events', function (done) {
      ddp = new DDP(validOptions);
      ddp.on('foo', () => done());
      ddp.emit('foo');
    });
    it('re-emits incoming public events', function (done) {
      ddp = new DDP(validOptions);
      ddp.on('ready', () => {
        done();
      });

      server.emit('message', '{"msg":"ready"}')
    });
    it('emits connected event', function (done) {
      validOptions.autoConnect = false;
      ddp = new DDP(validOptions);
      ddp.on('connected', () => done());
      ddp.connect();
      ddp.socket.on('open', () => {
        ddp.socket.emit('message:in', { msg: 'connected' });
      })
    });
    it('emits disconnected event', function (done) {
      validOptions.autoConnect = true;
      validOptions.autoReconnect = true;

      ddp = new DDP(validOptions);
      ddp.on('disconnected', () => {
        // will be set to false when actively calling disconnect
        expect(ddp.autoReconnect).to.equal(false);
        done()
      });

      ddp.socket.on('open', () => {
        ddp.socket.emit('message:in', { msg: 'connected' });
      });

      ddp.on('connected', () => {
        ddp.disconnect();
      })
    });
  });

  describe('methods', function () {
    it('adds a method to the message queue, to be sent via socket', function (done) {
      validOptions.autoConnect = false;
      validOptions.autoReconnect = false;
      ddp = new DDP(validOptions);
      ddp.disconnect()

      // should ignore methods when not connected
      // but when connected the queue will run
      ddp.method('foo', { foo: 'bar'})

      ddp.socket.on('message:out', message => {
        if (message.msg === 'method') {
          expect(message.id).to.equal('0');
          expect(message.method).to.equal('foo');
          expect(message.params).to.deep.equal({
            foo: 'bar'
          });
          done()
        }
      })

      ddp.connect();
      ddp.socket.on('open', () => {
        ddp.socket.emit('message:in', { msg: 'connected' });
      })
    });
  });
  describe('sub/unsub', function () {
    it('handles subscriptions', function () {
      validOptions.autoConnect = false;
      validOptions.autoReconnect = false;
      ddp = new DDP(validOptions);
      ddp.disconnect()

      // should ignore methods when not connected
      // but when connected the queue will run
      ddp.sub('foo', { foo: 'bar'})

      ddp.socket.on('message:out', message => {
        if (message.msg === 'sub') {
          expect(message.id).to.equal('1');
          expect(message.method).to.equal('foo');
          expect(message.params).to.deep.equal({
            foo: 'bar'
          });
          done()
        }
      })

      ddp.connect();
      ddp.socket.on('open', () => {
        ddp.socket.emit('message:in', { msg: 'connected' });
      })
    });
    it('handles unsubscription', function () {
      validOptions.autoConnect = false;
      validOptions.autoReconnect = false;
      ddp = new DDP(validOptions);
      ddp.disconnect()

      // should ignore methods when not connected
      // but when connected the queue will run
      ddp.unsub('1')

      ddp.socket.on('message:out', message => {
        if (message.msg === 'unsub') {
          expect(message.id).to.equal('2');
          expect(message.method).to.equal('foo');
          expect(message.params).to.deep.equal({
            foo: 'bar'
          });
          done()
        }
      })

      ddp.connect();
      ddp.socket.on('open', () => {
        ddp.socket.emit('message:in', { msg: 'connected' });
      })
    })
  });
});
