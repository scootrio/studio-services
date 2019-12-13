const Router = require('@koa/router');
const eventstream = require('./eventstream');

const router = new Router();

const TIMEOUT = 2147483647;

router.get('/subscribe', async ctx => {
  // Establish our Server-Side Events channel
  ctx.status = 200;
  ctx.req.setTimeout(TIMEOUT);
  ctx.type = 'text/event-stream; charset=utf8';
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');

  ctx.session.connected = true;

  const subscription = eventstream(ctx.session.id);

  ctx.body = subscription;

  const socket = ctx.socket;
  socket.on('close', close);
  socket.on('error', close);
  function close() {
    socket.removeListener('error', close);
  }
});

module.exports = router;
