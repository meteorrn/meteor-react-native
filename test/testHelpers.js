import sinon from 'sinon';
import Meteor from '../src/Meteor';

export const endpoint = 'ws://localhost:3000/websocket';

export const stubs = new Map();

export const stub = (target, name, handler) => {
  if (stubs.get(target)) {
    throw new Error(`already stubbed: ${name}`);
  }
  const stubbedTarget = sinon.stub(target, name);
  if (typeof handler === 'function') {
    stubbedTarget.callsFake(handler);
  } else {
    stubbedTarget.value(handler);
  }
  stubs.set(stubbedTarget, name);
};

export const restore = (target, name) => {
  if (!target[name] || !target[name].restore) {
    throw new Error(`not stubbed: ${name}`);
  }
  target[name].restore();
  stubs.delete(target);
};

export const overrideStub = (target, name, handler) => {
  restore(target, name);
  stub(target, name, handler);
};

export const restoreAll = () => {
  stubs.forEach((name, target) => {
    stubs.delete(target);
    target.restore();
  });
};

export const asyncTimeout = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const props = (obj) => {
  let p = [];
  for (; obj != null; obj = Object.getPrototypeOf(obj)) {
    let op = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < op.length; i++)
      if (p.indexOf(op[i]) === -1) p.push(op[i]);
  }
  return p;
};
