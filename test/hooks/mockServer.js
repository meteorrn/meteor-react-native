import { endpoint } from '../testHelpers';
import { Server } from 'mock-socket';
import EJSON from 'ejson';

let server;

// with this we mock a websocket server that runs for the full test-suite
// so we don't run into issues with open/close functionality

module.exports = {
  mochaGlobalSetup() {
    console.debug('Open mockserver on', endpoint);
    server = new Server(endpoint);

    // we need with newer mock-socket versions to
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

    /**
     * Test helper to define a Meteor Method
     * @param name {string} name of the method
     * @param response {function():*} function that mimics method behaviour
     * @param log {function=} optional log function to log raw data
     */
    server.method = ({ name, response, log = () => {} }) => {
      server.message((data, server, socket) => {
        log(name, data);
        const parsed = EJSON.parse(data);
        if (parsed.msg === 'method' && parsed.method === name) {
          socket.send(
            EJSON.stringify({
              msg: 'result',
              id: parsed.id,
              result: response(...parsed.params),
            })
          );
        }
      });
    };

    /**
     * Test helper to define a Meteor Publication. Supports subscribe/stop.
     * @param name {string} name of the publication
     * @param collection {string} name of the Mongo.Collection that will be synced by this pub
     * @param getDocs {function():object|object[]} function that mimics the doc(s) to return from the pub
     * @param log {function=} optional log function to log raw data
     */
    server.publish = ({ name, collection, getDocs, log = () => {} }) => {
      const messages = {
        docs: {
          sub: ({ doc, collection }) => {
            const { _id, _version, ...fields } = doc;
            return {
              msg: 'added',
              collection,
              id: _id,
              fields,
            };
          },
          unsub: ({ doc, collection }) => {
            return {
              msg: 'removed',
              collection,
              id: doc._id,
            };
          },
        },
        state: {
          sub: ({ id }) => {
            return { msg: 'ready', subs: [id] };
          },
          unsub: ({ id }) => {
            return { msg: 'nosub', id };
          },
        },
      };
      server.message((data, server, socket) => {
        log(name, data);
        const parsed = EJSON.parse(data);
        if (['sub', 'unsub'].includes(parsed.msg)) {
          let docs = getDocs(...(parsed.params || []));
          docs = Array.isArray(docs) ? docs : [docs];
          docs.forEach((doc) => {
            const docMessage = messages.docs[parsed.msg]({
              doc,
              collection,
              ...parsed,
            });
            setTimeout(() => socket.send(EJSON.stringify(docMessage)), 1);
          });

          const stateMessage = messages.state[parsed.msg]({
            collection,
            ...parsed,
          });
          setTimeout(() => socket.send(EJSON.stringify(stateMessage), 20));
        }
      });
    };

    server.on('connection', (socket) => {
      socket.on('message', (data) => {
        currentMessageFn(data, server, socket);
      });

      // simulate that we got a successful connection
      setTimeout(() => {
        socket.send(EJSON.stringify({ msg: 'connected' }));
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
