const Router = require('@koa/router');
const serve = require('koa-static');
const send = require('koa-send');
const path = require('path');

const router = new Router();

router.get('/', async ctx => {
  await send(ctx, 'index.html', { root: path.join(__dirname, '/public') });
});

router.use(serve(path.join(__dirname, '/public')));

module.exports = router;
