import { hashPassword, isPlainObject, uniqueId } from '../../lib/utils.js';
import { expect } from 'chai';

describe('utils', function () {
  describe(isPlainObject.name, function () {
    it('returns true for plain objects', function () {
      expect(isPlainObject({})).to.equal(true);
      expect(isPlainObject(Object.create(null))).to.equal(true);
    });
    it('returns false for non-plain objects', function () {
      class CustomClass {}
      const a = [];
      a.prototype = {};
      [
        '',
        new Date(),
        false,
        1,
        String(1),
        Number(1),
        [],
        () => {},
        null,
        undefined,
        new CustomClass(),
        a,
      ].forEach((obj) => {
        expect(isPlainObject(obj)).to.equal(false);
      });
    });
  });

  describe(uniqueId.name, function () {
    it('always returns a unique value', function () {
      const ids = new Set();

      for (let i = 0; i < 1000; i++) {
        const id = uniqueId();

        if (ids.has(id)) {
          expect.fail(`id ${id} already exists`);
        }

        ids.add(id);
      }
    });
  });

  describe(hashPassword.name, function () {
    it('creates a sha256 password hash', function () {
      const value = 'foo';
      const hashed = hashPassword(value);
      expect(hashed.digest).to.equal(
        '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae'
      );
    });
  });
});
