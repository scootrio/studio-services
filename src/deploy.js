/**
 * This file is where the logic for handling a deployment resides.
 *
 * When the server recieves a request to deploy a model configuration, the request is queued and an HTTP 202 "Accepted"
 * message is sent back to the client. When the request is queued, the session ID of who made the request is also
 * stored in the queue.
 *
 * This deploy "process" will read from the queue and execute the requests for deployements. It uses the ID stored in
 * the queue to grab a reference to the client's push notification EventEmitter so that it can update the client on
 * the progress of the request.
 *
 * When the process has finished, it will send a 'done' event to the EventEmitter.
 */
const { application, compute, storage, connection } = require('scootr');
const { http } = require('scootr/events');
const driver = require('scootr-aws');
const { US_WEST_2 } = require('scootr-aws/regions');
const { NODE_12X } = require('scootr-aws/runtimes');
const { DYNAMO_DB } = require('scootr-aws/storage');
const { info, error } = require('./logger');
const eventstream = require('./eventstream');
const queue = require('./queue');

const requests = queue('request');

async function processRequest({ id, config }) {
  const producer = eventstream(id);

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
    info('Deploying configuration');
    let results = await app.deploy(driver);
    info('Deployment completed');
    producer.emit('deploy:done', { message: 'Successfully deployed configuration', results });
  } catch (err) {
    error('Deployment failed to complete');
    producer.emit('deploy:error', { message: 'Deployment failed to complete', details: err.message });
  }
}

requests.process(processRequest);
