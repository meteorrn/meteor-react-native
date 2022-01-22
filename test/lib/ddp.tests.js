import DDP from '../../lib/ddp';
import { WebSocket, Server as SocketServer } from 'mock-socket';
import { expect } from 'chai';

describe('ddp', function() {
  let validOptions;
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

  it('should throw an error if not passed a socketConstructor', function() {
    expect(() => new DDP({})).to.throw('this.SocketConstructor is not a constructor');
  });

  it('should throw an error given no endpoint', function() {
    expect(() => new DDP({
      SocketConstructor: WebSocket,
    })).to.throw('Failed to construct \'WebSocket\': 1 argument required, but only 0 present');
  });

  it('should start in the disconnected state', function() {
    let ddp = new DDP(validOptions);
    expect(ddp.status).to.equal('disconnected');
  });

  it('should start with autoreconnect true given no autoReconnect parameter', function() {
    let ddp = new DDP(validOptions);
    expect(ddp.autoReconnect).to.equal(true);
  });

  it('should start with autoreconnect false given autoReconnect parameter set to false', function() {
    validOptions.autoReconnect = false;
    let ddp = new DDP(validOptions);
    expect(ddp.autoReconnect).to.equal(false);
  });

  it('should start with autoconnect true given no autoConnect parameter', function() {
    let ddp = new DDP(validOptions);
    expect(ddp.autoConnect).to.equal(true);
  });

  it('should start with autoconnect false given autoReconnect parameter set to false', function() {
    validOptions.autoConnect = false;
    let ddp = new DDP(validOptions);
    expect(ddp.autoConnect).to.equal(false);
  });
});
