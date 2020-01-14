const Router = require('@koa/router');
const eventstream = require('../eventstream');
const { info, warn } = require('../logger');

const router = new Router({prefix: '/streams'});

const TIMEOUT = 2147483647;

streams = {};

router.get('/subscribe', async ctx => {
  info('Subscription request received. Opening event stream');
  streams[ctx.session.id] = eventstream(ctx.session.id);
  ctx.status = 200;
});

router.get('/listen', async ctx => {
  const subscription = streams[ctx.session.id];
  if (!subscription) {
    warn('Attempt to listen without subscription')
    ctx.status = 400;
    ctx.body = {
      message: 'Invalid listen request'
    };
    return;
  }

  // Establish our Server-Side Events channel
  info('Listening on event stream');
  ctx.status = 200;
  ctx.req.setTimeout(TIMEOUT);
  ctx.type = 'text/event-stream; charset=utf-8';
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');

  ctx.body = subscription;

  const socket = ctx.socket;
  socket.on('close', close);
  socket.on('error', close);
  function close() {
    socket.removeListener('close', close);
    socket.removeListener('error', close);
    delete streams[ctx.session.id];
  }
});

module.exports = router;
