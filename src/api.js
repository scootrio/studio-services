const Router = require('@koa/router');
const { application, compute, storage, connection } = require('scootr');
const { http } = require('scootr/events');
const driver = require('scootr-aws');
const { US_WEST_2 } = require('scootr-aws/regions');
const { NODE_12X } = require('scootr-aws/runtimes');
const { DYNAMO_DB } = require('scootr-aws/storage');

const router = new Router({ prefix: '/api/v0' });

router.post('/deploy', async ctx => {
  const config = ctx.request.body;

  const app = application(config.application.id, US_WEST_2).name(config.application.name);

  const events = {};

  const objects = {
    compute: {},
    storage: {}
  };

  const connections = [];

  // Create all of the objects
  config.objects.forEach(obj => {
    switch (obj.type) {
      case 'event':
        events[obj.config.id] = http(obj.config.id)
          .method(obj.config.method)
          .path(obj.config.path);
        break;

      case 'compute':
        // Build a compute object
        objects.compute[obj.config.id] = compute(obj.config.id, NODE_12X).code(obj.config.code);
        break;

      case 'storage':
        objects.storage[obj.config.id] = storage(obj.config.id, DYNAMO_DB)
          .table(obj.config.table)
          .primary(obj.config.primaryName, obj.config.primaryType);
        break;

      default:
      // TODO: fail
    }
  });

  // Create all of the connections
  config.connections.forEach(conn => {
    switch (conn.type) {
      case 'event-compute':
        objects.compute[conn.target].on(events[conn.source]);
        break;

      case 'compute-storage':
        connections.push(
          connection(conn.id)
            .from(objects.compute[conn.source])
            .to(objects.storage[conn.target])
            .allow(conn.config.allows)
        );
        break;
    }
  });

  // Add everything to our application
  app
    .withAll(Object.values(events))
    .withAll(Object.values(objects.compute))
    .withAll(Object.values(objects.storage))
    .withAll(Object.values(connections));

  // Deploy
  try {
    console.log('Deploying');
    await app.deploy(driver);
  } catch (err) {
    ctx.staus = 500;
    ctx.body = {
      status: 500,
      message: err.message
    };
  }

  ctx.status = 200;
  ctx.body = {
    status: 200,
    message: 'Successfully deployed configuration',
    app
  };
});

module.exports = router;
