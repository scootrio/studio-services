const queue = require('../util/queue');

const plugin = {
  name: 'queue',
  register: async function(server, options) {
    server.ext('onPreHandler', function(request, h) {
      request.queue = queue;
      return h.continue;
    });
  }
};

module.exports = plugin;
