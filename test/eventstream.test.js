require('chai').should();
require('../src/util/logger').config.silent = true;

const eventstream = require('../src/util/eventstream');
const { Writable } = require('stream');

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

describe('EventStream', () => {
  it('should emit data to listeners', done => {
    const e = eventstream.create('test-emit');

    let val = 1;

    e.on('test:event', data => {
      data.should.equal(val);
    });

    listenForDoneOnStream(e, done);

    e.emit('test:event', val);

    e.destroy();
  });

  it('should pipe data in SSE format', done => {
    const e = eventstream.create('test-sse');

    const vals = [1, 2, 3];
    const sses = vals.map(v => 'event: test:event\ndata: ' + v + '\n\n');

    const writer = createWritableStreamForTest(chunk => chunk.should.be.oneOf(sses), done);

    e.pipe(writer);

    vals.forEach(v => e.emit('test:event', v));

    e.unpipe(writer);
    e.destroy();
    writer.destroy();
  });
});
