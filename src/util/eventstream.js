/**
 * This file contains the logic for registering and retreiving event emitters for new sessions that have subscribed
 * to receive notifications from the asynchronous actions conducted by the server.
 */
const { Readable } = require('stream');

const _streams = {};

class EventStream extends Readable {
  constructor() {
    super();
  }

  _read() {
    return false;
  }

  emit(event, data, ...args) {
    super.emit(event, data, ...args);
    if (event.includes(':')) {
      if (!data) data = {};
      this.push('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
      if (this._compressor) {
        this._compressor.flush();
      }
    }
  }

  setCompressor(comp) {
    this._compressor = comp;
  }
}

function create(id) {
  const es = new EventStream();

  es.on('close', function() {
    delete _streams[id];
  });

  _streams[id] = es;

  return es;
}

function get(id) {
  if (!_streams[id]) {
    return null;
  }
  return _streams[id];
}

module.exports = {
  create,
  get
};
