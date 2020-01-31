/**
 * This file contains the log processing that occurs outside of the API event loop. It will process requests for
 * logs using the `serverless logs` function. This is a quick patch. Ultimately, we will be moving this into the
 * AWS Driver itself.
 */
const { spawn } = require('child_process');
const path = require('path');
const { Duplex } = require('stream');
const logger = require('../util/logger');

const kEvents = Symbol('events');

class LogEventDuplexStream extends Duplex {
  constructor(options) {
    super(options);
    this._compressor = null;
    this[kEvents] = [];
  }

  _write(chunk, encoding, callback) {
    if (Buffer.isBuffer(chunk)) {
      chunk = chunk.toString();
    }
    const data = { message: chunk };
    const event = `event: logs:entry\ndata: ${JSON.stringify(data)}\n\n`;
    logger.trace('Transformed event\n' + event);
    //this[kEvents].push(event);
    this.push(event);
    this._compressor.flush();
    callback();
  }

  _read(size) {
    return false;
  }

  setCompressor(comp) {
    this._compressor = comp;
  }
}

function createSseLogStreamForCompute(computeName) {
  const command = 'serverless';
  const args = ['logs', '-f', computeName, '--startTime', '30m', '-t'];

  logger.debug('Running', command, args.join(' '));

  const svs = spawn(command, args, {
    cwd: path.join(process.cwd(), '.scoots')
  });

  logger.debug('Log process started');

  svs.on('close', function() {
    logger.debug('Log process closed');
  });

  const stream = new LogEventDuplexStream();

  return {
    events: svs.stdout.pipe(stream),

    close: function() {
      svs.kill();
    }
  };
}

module.exports = { createSseLogStreamForCompute };
