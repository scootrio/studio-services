const Koa = require('koa');
const Router = require('@koa/router');
const spa = require('./spa');
const api = require('./api');

const app = new Koa();

const router = new Router();
router.use('/api/v0', api.routes());

app.use(spa.routes());
app.use(router.routes());

app.listen(3000, () => {
  console.log('Studio Services are running');
});
