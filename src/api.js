const Router = require('@koa/router');
const queue = require('./queue')('requests');

const router = new Router({ prefix: '/api/v0' });

router.post('/deploy', async ctx => {
  const config = ctx.request.body;

  queue.push({ id: ctx.session.id, config });

  ctx.status = 202;
  ctx.body = {
    message: 'Request has been queued for processing'
  };
});

module.exports = router;
