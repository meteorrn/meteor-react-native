import MongoID from '../../lib/mongo-id.js';
import EJSON from 'ejson';
import { expect } from 'chai';

const randomHex = (length) => {
  let str = '';
  for (let j = 0; j < length; j++) {
    str += Math.floor(Math.random() * 16).toString(16);
  }
  return str;
};

const createObjectId = () => new MongoID.ObjectID(randomHex(24));

describe('mongo-id', function () {
  describe(MongoID._looksLikeObjectID.name, function () {
    it('determines, if a string looks like an ObjectID', function () {
      for (let i = 0; i < 24; i++) {
        const str = randomHex(i);
        expect(!!MongoID._looksLikeObjectID(str)).to.equal(false);
      }

      for (let j = 0; j < 100; j++) {
        const str = randomHex(24);
        expect(!!MongoID._looksLikeObjectID(str)).to.equal(true);
      }
    });
  });
  describe(MongoID.ObjectID.name, function () {
    it('throws if the hex string is not given', function () {
      expect(() => MongoID.ObjectID()).to.throw(
        'Random.hexString not implemented, please pass a hexString'
      );
    });
    it('throws if the hex string is not a valid ObjectID-like', function () {
      for (let i = 0; i < 24; i++) {
        const str = randomHex(i) || '1';
        expect(() => MongoID.ObjectID(str)).to.throw(
          'Invalid hexadecimal string for creating an ObjectI'
        );
      }

      for (let j = 0; j < 10; j++) {
        const str = randomHex(23) + 'g';
        expect(() => MongoID.ObjectID(str)).to.throw(
          'Invalid hexadecimal string for creating an ObjectI'
        );
      }
    });
  });
  describe(MongoID.idStringify.name, function () {
    it('strinigifies to EJSON compatible type', function () {
      const oid = createObjectId();
      expect(MongoID.idStringify('')).to.equal('');
      expect(MongoID.idStringify()).to.equal('-');
      expect(MongoID.idStringify(oid)).to.equal(oid._str);
      expect(MongoID.idStringify(oid._str)).to.equal('-' + oid._str);
      expect(MongoID.idStringify('foobar')).to.equal('foobar');

      const jsonStr = JSON.stringify({ value: oid._str });
      expect(MongoID.idStringify(jsonStr)).to.equal('-' + jsonStr);

      [true, false, 0, 1, -1, null].forEach((val) => {
        expect(MongoID.idStringify(val)).to.equal('~' + JSON.stringify(val));
      });

      expect(() => MongoID.idStringify(new Date())).to.throw(
        'Meteor does not currently support objects other than ObjectID as ids'
      );
    });
  });

  describe(MongoID.idParse.name, function () {
    it('parses valid id strings', function () {
      expect(MongoID.idParse('foo')).to.equal('foo');
      expect(MongoID.idParse('')).to.equal('');
      expect(MongoID.idParse('-')).to.equal(undefined);
      expect(MongoID.idParse('-foo')).to.equal('foo');
      expect(MongoID.idParse('~{"foo":"bar"}')).to.deep.equal({
        foo: 'bar',
      });
      const hex = randomHex(24);
      const oid = MongoID.idParse(hex);
      expect(oid._str).to.equal(hex);
    });
  });

  describe('prototype', function () {
    it('implements a toString method', function () {
      const oid = createObjectId();
      const str = `ObjectID("${oid._str}")`;
      expect(oid.toString()).to.equal(str);
    });

    it('implements an equals method', function () {
      const hex = randomHex(24);
      const oid1 = new MongoID.ObjectID(hex);
      const oid2 = new MongoID.ObjectID(hex);
      const oid3 = new MongoID.ObjectID(randomHex(24));

      expect(oid1.equals(oid1)).to.equal(true);
      expect(oid1.equals(oid1.clone())).to.equal(true);
      expect(oid1.equals(oid2)).to.equal(true);
      expect(oid2.equals(oid2)).to.equal(true);
      expect(oid2.equals(oid2.clone())).to.equal(true);
      expect(oid2.equals(oid1)).to.equal(true);

      expect(oid1.equals(oid3)).to.equal(false);
      expect(oid2.equals(oid3)).to.equal(false);
    });

    it('returns the mongo timestamp', function () {
      const timeStamp = 1234567800;
      const hex = `${timeStamp.toString(16)}${randomHex(16)}`;
      const oid = new MongoID.ObjectID(hex);
      expect(oid.getTimestamp()).to.equal(timeStamp);
    });
  });

  describe('EJSON', function () {
    it('is ejsonable', function () {
      const oid = createObjectId();
      const str = EJSON.stringify(oid);
      const expected = `{"$type":"oid","$value":"${oid._str}"}`;
      expect(str).to.deep.equal(expected);
      expect(EJSON.parse(expected).equals(oid)).to.equal(true);
    });
  });
});
