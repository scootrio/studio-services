const { info } = require('../util/logger');
const Boom = require('@hapi/boom');
const eventstream = require('../util/eventstream');

function handlePostToDeploy(request, h) {
  request.queue('requests').push({ id: request.yar.id, config: request.payload });
  return {
    message: 'Request has been queued for processing'
  };
}

function handleGetToStreamSubscribe(request, h) {
  info('Subscription request received. Opening event stream');
  eventstream.create(request.yar.id);
  request.yar.set('isStreaming', true);
  return {
    message: 'Successfully subscribed to streaming.'
  };
}

function handleGetToStreamListen(request, h) {
  if (!request.yar.get('isStreaming')) {
    warn('Attempt to listen without first subscribing');
    Boom.badRequest('Invalid request to listen without subscription');
  }

  // Establish our Server-Side Events channel
  info('Listening on event stream');
  const stream = eventstream.get(request.yar.id);
  stream.on('close', function() {
    request.yar.set('isStreaming', false);
  });

  return h
    .response(stream)
    .code(200)
    .type('text/event-stream; charset=utf-8')
    .header('Cache-Control', 'no-cache')
    .header('Connection', 'keep-alive');
}

module.exports = {
  handlePostToDeploy,
  handleGetToStreamSubscribe,
  handleGetToStreamListen
};
