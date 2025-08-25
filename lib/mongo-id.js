//https://github.com/meteor/meteor/tree/master/packages/mongo-id
import EJSON from 'ejson';

/**
 * Reference implementation of Meteor's MongoID
 * @type {{}}
 */
const MongoID = {};

const objectIdRegex = /^[0-9a-f]*$/;

MongoID._looksLikeObjectID = function _looksLikeObjectID(str) {
  return str.length === 24 && objectIdRegex.test(str);
};

/**
 * Create a Mongo-style ObjectID. If you don't specify a hexString,
 * the ObjectID will be generated randomly (not using MongoDB's ID construction rules).
 * @param hexString {string=}
 *     Optional. The 24-character hexadecimal contents of the ObjectID to create
 * @constructor
 * @see https://docs.meteor.com/api/collections.html#Mongo-ObjectID
 */
MongoID.ObjectID = function ObjectID(hexString) {
  // TODO rewrite es ES6 class!
  //random-based impl of Mongo ObjectID
  var self = this;
  if (hexString) {
    hexString = hexString.toLowerCase();
    if (!MongoID._looksLikeObjectID(hexString)) {
      throw new Error('Invalid hexadecimal string for creating an ObjectID');
    }
    // meant to work with _.isEqual(), which relies on structural equality
    self._str = hexString;
  } else {
    // self._str = Random.hexString(24);
    throw new Error(
      'Random.hexString not implemented, please pass a hexString'
    );
  }
};

MongoID.ObjectID.prototype.toString = function toString() {
  var self = this;
  return 'ObjectID("' + self._str + '")';
};

MongoID.ObjectID.prototype.equals = function equals(other) {
  var self = this;
  return (
    other instanceof MongoID.ObjectID && self.valueOf() === other.valueOf()
  );
};

MongoID.ObjectID.prototype.clone = function clone() {
  var self = this;
  return new MongoID.ObjectID(self._str);
};

MongoID.ObjectID.prototype.typeName = function typeName() {
  return 'oid';
};

MongoID.ObjectID.prototype.getTimestamp = function getTimestamp() {
  var self = this;
  return parseInt(self._str.substr(0, 8), 16);
};

MongoID.ObjectID.prototype.valueOf =
  MongoID.ObjectID.prototype.toJSONValue =
  MongoID.ObjectID.prototype.toHexString =
    function () {
      return this._str;
    };

EJSON.addType('oid', function (str) {
  return new MongoID.ObjectID(str);
});

MongoID.idStringify = function idStringify(id) {
  if (id instanceof MongoID.ObjectID) {
    return id.valueOf();
  } else if (typeof id === 'string') {
    if (id === '') {
      return id;
    } else if (
      id.substr(0, 1) === '-' || // escape previously dashed strings
      id.substr(0, 1) === '~' || // escape escaped numbers, true, false
      MongoID._looksLikeObjectID(id) || // escape object-id-form strings
      id.substr(0, 1) === '{'
    ) {
      // escape object-form strings, for maybe implementing later
      return '-' + id;
    } else {
      return id; // other strings go through unchanged.
    }
  } else if (id === undefined) {
    return '-';
  } else if (typeof id === 'object' && id !== null) {
    throw new Error(
      'Meteor does not currently support objects other than ObjectID as ids'
    );
  } else {
    // Numbers, true, false, null
    return '~' + JSON.stringify(id);
  }
};

MongoID.idParse = function idParse(id) {
  if (id === '') {
    return id;
  } else if (id === '-') {
    return undefined;
  } else if (id.substr(0, 1) === '-') {
    return id.substr(1);
  } else if (id.substr(0, 1) === '~') {
    return JSON.parse(id.substr(1));
  } else if (MongoID._looksLikeObjectID(id)) {
    return new MongoID.ObjectID(id);
  } else {
    return id;
  }
};

export default MongoID;
