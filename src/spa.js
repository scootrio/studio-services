const Router = require('@koa/router');
const serve = require('koa-static');
const send = require('koa-send');
const path = require('path');

const router = new Router();

const publicDir = path.join(__dirname, 'public');
const appDir = path.join(publicDir, 'app');

router.get(['/', 'index', '/index.html'], async ctx => {
  await send(ctx, 'index.html', { root: appDir });
});

router.get('/main.js', async ctx => {
  await send(ctx, 'main.js', { root: appDir });
});

router.use(serve(publicDir));

module.exports = router;
