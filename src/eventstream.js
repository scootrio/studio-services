/**
 * This file contains the logic for registering and retreiving event emitters for new sessions that have subscribed
 * to receive notifications from the asynchronous actions conducted by the server.
 */
const { Readable } = require('stream');
const { error } = require('./logger');

module.exports = eventstream;

const _streams = {};

class EventStream extends Readable {
  constructor() {
    super({ objectMode: true });
    this._events = [];
  }

  _read() {
    while (this._events.length && this.push(this._events.shift()));
    return false;
  }

  emit(event, data, ...args) {
    super.emit(event, data, ...args);
    if (event.includes(':')) {
      this.push('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
    }
  }
}

function eventstream(id) {
  if (_streams[id]) {
    return _streams[id];
  }

  const es = new EventStream();

  es.on('error', err => {
    error(err.message);
  });

  _streams[id] = es;

  return es;
}
