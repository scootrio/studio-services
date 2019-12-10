const Router = require('@koa/router');

const router = new Router({ prefix: '/api/v0' });

router.post('/deploy', async ctx => {
  ctx.status = 201;
  ctx.body = {
    status: 201,
    message: 'Successfully deployed configuration'
  };
});

module.exports = router;
