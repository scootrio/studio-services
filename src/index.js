const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const spa = require('./spa');
const api = require('./api');

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(spa.routes()).use(spa.allowedMethods());
app.use(api.routes()).use(api.allowedMethods());

app.listen(3030, () => {
  console.log('Studio Services are running');
});
