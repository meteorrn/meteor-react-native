import Data from './Data';

/**
 * Calls a method over DDP with given arguments
 * @param eventName {string} required, the method to call
 * @param args {...array} optional arguments
 */
export default function (eventName, ...args) {
  let callback;
  if (args.length && typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }

  const id = Data.ddp.method(eventName, args);
  Data.calls.push({
    id: id,
    callback: callback,
  });
}
