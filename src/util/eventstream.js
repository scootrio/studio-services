/**
 * This file contains the logic for registering and retreiving event emitters for new sessions that have subscribed
 * to receive notifications from the asynchronous actions conducted by the server.
 */
const { Readable } = require('stream');
const { debug, info, error } = require('./logger');

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
      debug(event, data);
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
  info('Creating event stream ' + id);
  const es = new EventStream();

  es.on('error', function(err) {
    error(err.message);
  });

  es.on('close', function() {
    info('Closing event stream ' + id);
  });

  _streams[id] = es;

  return es;
}

function get(id) {
  if (!_streams[id]) {
    return null;
  }
  info('Using event stream ' + id);
  return _streams[id];
}

module.exports = {
  create,
  get
};
