import { expect } from 'chai';
import ReactiveDict from '../../src/ReactiveDict';
import MongoID from '../../lib/mongo-id';

describe('ReactiveDict', function () {
  it('sets to undefined', function () {
    const dict = new ReactiveDict();
    dict.set('foo', undefined);
    expect(dict.get('foo')).to.equal(undefined);
  });
  it('sets from objects', function () {
    const dict = new ReactiveDict();
    dict.set({ foo: 'bar', bar: undefined });
    expect(dict.get('foo')).to.equal('bar');
    expect(dict.get('bar')).to.equal(undefined);
  });
  it('initialize with data', function () {
    const now = new Date();
    const dict = new ReactiveDict({ now: now });

    const nowFromDict = dict.get('now');
    expect(nowFromDict.getTime()).to.equal(now.getTime());
  });
  it('has setDefault', function () {
    let dict = new ReactiveDict();
    dict.set('A', 'blah');
    dict.set('B', undefined);

    expect(dict.get('A')).to.equal('blah');
    expect(dict.get('B')).to.equal(undefined);

    dict.setDefault('A', 'default'); // should be ignored
    dict.setDefault('B', 'default'); // should be ignored
    dict.setDefault('C', 'default'); // should be set
    dict.setDefault('D', undefined); // should be set

    expect(dict.get('A')).to.equal('blah');
    expect(dict.get('B')).to.equal('default');
    expect(dict.get('C')).to.equal('default');
    expect(dict.get('D')).to.equal(undefined);

    // with object
    dict = new ReactiveDict();
    dict.set({ A: undefined, B: 'blah' });
    dict.setDefault('A', 'default');

    expect(dict.get('A')).to.equal('default');
    expect(dict.get('B')).to.equal('blah');
  });
  it('has equals implemented', function () {
    const dict = new ReactiveDict();
    [
      null,
      'bar',
      1,
      true,
      new Date(),
      new MongoID.ObjectID('ffffffffffffffffffffffff'),
    ].forEach((value) => {
      expect(dict.equals('foo', value)).to.equal(false);
      dict.set('foo', value);
      expect(dict.equals('foo', value)).to.equal(true);
    });

    // throws for other types
    class Custom {}

    expect(() => dict.equals('foo', new Custom())).to.throw(
      'ReactiveDict.equals: value must be scalar'
    );
  });
});
