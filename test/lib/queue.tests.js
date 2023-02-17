import Queue from '../../lib/queue';
import { expect } from 'chai';

describe('queue', function () {
  it('delegates operations to a consumer', function () {
    const q = new Queue((obj) => {
      expect(q.queue.length).to.equal(1);
      expect(obj.id).to.equal('foo');
      return true;
    });
    q.push({ id: 'foo' });
    expect(q.queue.length).to.equal(0);

    q.consumer = () => false;
    q.push({ id: 'foo' });
    expect(q.queue.length).to.equal(1);

    q.empty();
    expect(q.queue.length).to.equal(0);
  });
});
