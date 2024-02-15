import { endpoint } from '../testHelpers';
import { Server } from 'mock-socket';

let server;

// with this we mock a websocket server that runs for the full test-suite
// so we don't run into issues with open/close functionality

module.exports = {
  mochaGlobalSetup() {
    console.debug('Open mockserver on', endpoint);
    server = new Server(endpoint);

    // we need with never mock-socket versions to
    // handle the way it responds from within a connected callback
    // thus we create some ioc pattern here to allow
    // test clients to implement test-specific behaviour
    const messageFn = (data) => server.emit('message', data);
    let currentMessageFn = messageFn;

    server.message = (fn) => {
      if (typeof fn === 'function') {
        currentMessageFn = fn;
      } else {
        currentMessageFn = messageFn;
      }
    };

    server.on('connection', (socket) => {
      socket.on('message', (data) => {
        currentMessageFn(data, server, socket);
      });

      // simulate that we got a successful connection
      setTimeout(() => {
        socket.send(JSON.stringify({ msg: 'connected' }));
      }, 10);
    });
  },
  mochaGlobalTeardown() {
    console.debug('Closing mockserver');
    server.stop();
  },
  // some tests might need access to the server to mock a response
  server: () => server,
};
