import Random from '../../lib/Random';
import { expect } from 'chai';

describe('Random', function() {
  it('generates a 17 char long id by default', function() {
    expect(Random.id().length).to.equal(17);
  });
  it('generates a n char long id', function() {
    for (let i = 0; i < 128; i++) {
      expect(Random.id(i).length).to.equal(i);
    }
  });
  it('generates ids with unmistakable chars', function() {
    const regex = /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]*$/;

    for (let i = 0; i < 128; i++) {
      const id = Random.id();
      expect(regex.test(id)).to.equal(true);
    }
  });
});
