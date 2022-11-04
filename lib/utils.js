import SHA256 from 'crypto-js/sha256';

var i = 0;
export function uniqueId() {
  return (i++).toString();
}

// XXX: we should extract this function and let clients inject
// it, so they can leverage react-native crypto packages that
// implement a secure hashing algorithm like bcrypt
export function hashPassword(password) {
  return {
    digest: SHA256(password).toString(), // lgtm [js/insufficient-password-hash]
    algorithm: 'sha-256',
  };
}

//From Meteor core
var class2type = {};

var toString = class2type.toString;

export const hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

var support = {};

// Populate the class2type map
const typeMap = 'Boolean Number String Function Array Date RegExp Object Error';
typeMap.split(' ').forEach((name, i) => {
  class2type[`[object ${name}]`] = name.toLowerCase();
});

function type(obj) {
  if (obj == null) {
    return obj + '';
  }
  return typeof obj === 'object' || typeof obj === 'function'
    ? class2type[toString.call(obj)] || 'object'
    : typeof obj;
}

function isWindow(obj) {
  /* jshint eqeqeq: false */
  return obj != null && obj == obj.window;
}

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
  for (key in obj) {}

  return key === undefined || hasOwn(obj, key);
}
