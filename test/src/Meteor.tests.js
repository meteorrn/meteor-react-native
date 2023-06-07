import { expect } from 'chai';
import Meteor from '../../src/Meteor';

describe('Meteor - integration', function () {
  it('uses the default async storage if none is defined', function () {
    const fallback =
      require('@react-native-async-storage/async-storage').default;
    const { AsyncStorage } = Meteor.packageInterface();
    expect(AsyncStorage).to.equal(fallback);
  });
});
