require('chai').should();

const { Writable } = require('stream');
const eventstream = require('../src/eventstream');
const queue = require('../src/queue');

const listenForDoneOnStream = (stream, done) => {
  let isDoneCalled = false;
  stream.on('error', err => {
    if (!isDoneCalled) {
      isDoneCalled = true;
      done(err);
    }
  });

  stream.on('close', () => {
    if (!isDoneCalled) {
      isDoneCalled = true;
      done();
    }
  });
};

const createWritableStreamForTest = (test, done) => {
  const writer = new Writable({
    write(chunk, encoding, cb) {
      test(chunk.toString());
      cb();
    }
  });

  listenForDoneOnStream(writer, done);

  return writer;
};

describe('Deploy', () => {
  it('should process a request from a queue', done => {
    const e = eventstream('test');
    const q = queue('test');

    let event = 'test:event';
    let vals = [1, 2, 3];
    const sses = vals.map(v => 'event: ' + event + '\ndata: ' + v + '\n\n');

    const sink = createWritableStreamForTest(chunk => chunk.should.be.oneOf(sses), done);

    e.on(event, data => {
      data.should.be.oneOf(vals);
    });

    q.process(async data => {
      data.should.be.oneOf(vals);
      e.emit(event, data);
    });

    e.pipe(sink);

    vals.forEach(q.push);

    setTimeout(() => {
      e.unpipe(sink);
      e.destroy();
      sink.destroy();
    }, 3000);
  }).timeout(5000);
});
