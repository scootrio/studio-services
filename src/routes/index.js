const apiHandlers = require('./api-handlers');

function api(path) {
  return '/api/v0' + path;
}

const routes = [
  {
    method: 'POST',
    path: api('/deploy'),
    handler: apiHandlers.handlePostToDeploy
  },
  {
    method: 'GET',
    path: api('/streams/subscribe'),
    handler: apiHandlers.handleGetToStreamSubscribe
  },
  {
    method: 'GET',
    path: api('/streams/listen'),
    handler: apiHandlers.handleGetToStreamListen,
    options: {
      timeout: {
        server: false,
        socket: false
      }
    }
  }
];

module.exports = routes;
