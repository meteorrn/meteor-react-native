import { SHA256 } from './sha256.js';

var i = 0;

/**
 * Returns an ever incrementing integer value as string
 * @returns {string}
 */
export function uniqueId() {
  return (i++).toString();
}

/**
 * Returns a Meteor-Accounts compatible password hash.
 * @param password
 * @returns {{digest: string, algorithm: string}}
 */
export function hashPassword(password) {
  // XXX: we should extract this function in a way to let clients inject
  // it, so they can leverage react-native crypto packages that
  // implement a secure hashing algorithm like bcrypt
  // but ut we should do it in a way, that this is the default
  return {
    digest: SHA256(password),
    algorithm: 'sha-256',
  };
}

//From Meteor core
var class2type = {};

var toString = class2type.toString;

/**
 * Short for Object.prototype.hasOwnProperty.call
 * @param obj {*}
 * @param prop {string}
 * @returns {boolean}
 */
export const hasOwn = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

var support = {};

// Populate the class2type map
// TODO should we include Symbol, Generator, Iterator, BigInt etc.?
const typeMap = 'Boolean Number String Function Array Date RegExp Object Error';
typeMap.split(' ').forEach((name, i) => {
  class2type[`[object ${name}]`] = name.toLowerCase();
});

/**
 * Attempts to reliably determine the type of a given value
 * @param obj {any}
 * @returns {string}
 */
function type(obj) {
  if (obj == null) {
    return obj + '';
  }
  return typeof obj === 'object' || typeof obj === 'function'
    ? class2type[toString.call(obj)] || 'object'
    : typeof obj;
}

/**
 * Ducktyping check if an object is the window object
 * @param obj
 * @returns {boolean}
 */
function isWindow(obj) {
  /* jshint eqeqeq: false */
  return obj != null && obj == obj.window;
}

/**
 * Checks, whether a given object is a plain object,
 * as opposed to objects that are instances of a class
 * other than Object.
 * @param obj
 * @returns {boolean}
 */
export function isPlainObject(obj) {
  var key;

  // Must be an Object.
  // Because of IE, we also have to check the presence of the constructor property.
  // Make sure that DOM nodes and window objects don't pass through, as well
  if (!obj || type(obj) !== 'object' || obj.nodeType || isWindow(obj)) {
    return false;
  }

  try {
    // Not own constructor property must be Object
    if (
      obj.constructor &&
      !hasOwn(obj, 'constructor') &&
      !hasOwn(obj.constructor.prototype, 'isPrototypeOf')
    ) {
      return false;
    }
  } catch (e) {
    // IE8,9 Will throw exceptions on certain host objects #9897
    return false;
  }

  // Support: IE<9
  // Handle iteration over inherited properties before own properties.
  if (support.ownLast) {
    for (key in obj) {
      return hasOwn(obj, key);
    }
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.
  for (key in obj) {
  }

  return key === undefined || hasOwn(obj, key);
}
