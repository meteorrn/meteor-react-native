import { Server } from 'mock-socket';

const endpoint = 'ws://localhost:3000/websocket';
let _server;

// with this we mock a websocket server that runs for the full test-suite,
// so we don't run into issues with open/close functionality

export async function mochaGlobalSetup() {
  console.debug('Open mockserver on', endpoint);
  _server = new Server(endpoint);

  // we need with never mock-socket versions to
  // handle the way it responds from within a connected callback
  // thus we create some ioc pattern here to allow
  // test clients to implement test-specific behaviour
  const messageFn = (data) => _server.emit('message', data);
  let currentMessageFn = messageFn;

  _server.message = (fn) => {
    if (typeof fn === 'function') {
      currentMessageFn = fn;
    } else {
      currentMessageFn = messageFn;
    }
  };

  console.debug('mockserver wait for connected...');
  await new Promise((resolve) => {
    _server.on('connection', (socket) => {
      socket.on('message', (data) => {
        currentMessageFn(data, _server, socket);
      });
      resolve();
    });
  });
  console.debug('end of setup');
}

export async function mochaGlobalTeardown() {
  console.debug('Closing mockserver');
  _server.stop();
}

export const server = () => _server;
