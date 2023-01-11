const endpoint = 'ws://localhost:3000/websocket';
import { Server } from 'mock-socket';

let server;

// with this we mock a websocket server that runs for the full test-suite
// so we don't run into issues with open/close functionality

module.exports = {
  mochaGlobalSetup() {
    console.debug('Open mockserver on', endpoint);
    server = new Server(endpoint);
  },
  mochaGlobalTeardown() {
    console.debug('Closing mockserver');
    server.stop();
  },
  // some tests might need access to the server to mock a response
  server: () => server,
};
