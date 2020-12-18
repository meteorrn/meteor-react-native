import Meteor from './Meteor.js';
import User from './user/User.js';
import Accounts from './user/Accounts.js';

Object.assign(Meteor, User);

const {
    withTracker, Mongo, packageInterface, ReactiveDict
} = Meteor;

export { Accounts, withTracker, Mongo, packageInterface, ReactiveDict };
export default Meteor;