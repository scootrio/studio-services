const Koa = require('koa');
const cors = require('@koa/cors');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');
const uuid = require('uuid/v4');
const spa = require('./spa');
const api = require('./api');
const { info } = require('./logger');

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
app.use(
  cors({
    credentials: true
  })
);

// Enable automatic parsing of simple content types in requests
app.use(bodyParser());

// Register our routes
app.use(spa.routes()).use(spa.allowedMethods());
app.use(api.routes()).use(api.allowedMethods());

// Start our deployment worker
require('./deploy');

// Start the services
const port = process.env.STUDIO_SERVICES_PORT || 3030;
app.listen(port, () => {
  info('Running on port ' + port);
});
