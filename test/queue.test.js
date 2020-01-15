require('chai').should();

const queue = require('../src/util/queue');

describe('Queue', () => {
  let q;

  beforeEach(() => {
    q = queue('test');
  });

  afterEach(() => {
    q.close();
  });

  describe('#push', () => {
    it('should queue a request', () => {
      q.push(1);

      q.requests().should.contain(1);
    });
  });

  describe('#pull', () => {
    it('should pull a request from the queue', () => {
      let val = 2;
      q.push(val);

      q.pull().should.equal(val);
    });
  });

  describe('#process', () => {
    it('should process requests from a non-empty queue', done => {
      let vals = [1, 2, 3];
      vals.forEach(q.push);

      let pending = vals.length;
      q.process(async val => {
        try {
          val.should.be.oneOf(vals);
        } catch (err) {
          done(err);
        }
        if (--pending === 0) {
          done();
        }
      });
    });
  });
});
