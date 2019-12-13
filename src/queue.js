/**
 * This is our implementation of an asynchronous queue for processing requests.
 *
 * See the `deploy.js` file for more information about how deployments are handled by Scootr.
 */
module.exports = queue;

const _queues = {};

/**
 * @typedef {Object} RequestQueue A queue used to process requests pushed into the queue asynchronously.
 * @property {Function} configure
 * @property {Function} push
 * @property {Function} process
 * @property {Function} close
 */

/**
 * Creates a named, asyncrhonous job processing queue. If a queue with the provided name already exists, it will be
 * returned. Otherwise, a new queue will be created and returned.
 * @returns {RequestQueue}
 */
function queue(name) {
  if (_queues[name]) {
    return _queues[name];
  }

  const _requests = [];
  let _running = 0;
  let _open = true;
  let _processors = 0;
  let _options = {
    maxConcurrent: -1,
    pollMs: 1000
  };

  const q = {
    /**
     * Configures the queue according to the provided options.
     *
     * @param {Object} options The options used to configure the queue.
     * @param {Number} [options.maxConcurrent=-1] The maximum number of requests that can be processed at any given time.
     *     A value of -1 indicates no maximum.
     * @param {Number} [options.pollMs=1000] The number of milliseconds to wait before polling a previously empty queue to
     *     see if there is a request waiting to be processed.
     */
    configure(options) {
      _options = {
        ..._options,
        ...options
      };
    },

    /**
     * Adds a new request to the queue to be processed later.
     *
     * @param {Object} request The request to add to the queue
     */
    push(request) {
      if (!_open) throw new Error('Cannot push onto a closed queue');
      _requests.push(request);
    },

    /**
     * Continuously processes a job from the request queue.
     *
     * @param {AsyncFunction} action The action used to process jobs from the queue.
     */
    async process(action) {
      if (!_open) throw new Error('Cannot process from a closed queue');
      ++_processors;
      while (_open) {
        if (
          (_options.maxConcurrent < 0 || (_options.maxConcurrent > 0 && _running < _options.maxConcurrent)) &&
          _requests.length > 0
        ) {
          await action(_requests.shift());
        } else {
          await _sleep(_options.pollMs);
        }
      }
      if (--_processors === 0) {
        delete _queues[name];
      }
    },

    close() {
      _open = false;
    }
  };

  _queues[name] = q;

  return q;
}

function _sleep(ms) {
  return new Promise((resolve, _) => {
    setTimeout(resolve, ms);
  });
}
