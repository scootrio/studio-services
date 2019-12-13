const Koa = require('koa');
const cors = require('@koa/cors');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');
const uuid = require('uuid/v4');
const spa = require('./spa');
const api = require('./api');
const subscribe = require('./subscribe');

const app = new Koa();

// Configure our application keys used for cryptographic purposes
app.keys = [process.env.STUDIO_SERVICES_KEY];

// Initialize our session middleware
const CONFIG = {
  key: 'studio-services:session'
};
app.use(session(CONFIG, app)).use(async (ctx, next) => {
  if (!ctx.session.id) ctx.session.id = uuid();
  await next();
});

// Enable CORS requests
// SECURITY: tighten the noose on security here
app.use(cors());

// Enable automatic parsing of simple content types in requests
app.use(bodyParser());

// Register our routes
app.use(spa.routes()).use(spa.allowedMethods());
app.use(api.routes()).use(api.allowedMethods());
app.use(subscribe.routes()).use(subscribe.allowedMethods());

// Start our deployment worker
require('./deploy');

// Start the services
app.listen(3030, () => {
  console.log('Studio Services are running');
});
