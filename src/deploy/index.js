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
const { info, error } = require('../util/logger');
const eventstream = require('../util/eventstream');
const useAws = require('./aws');

async function processRequest({ id, config }) {
  const producer = eventstream.get(id);

  producer.emit('deployment:progress', { message: 'Building application' });

  let build = null;
  try {
    switch (config.app.provider) {
      case 'aws':
        build = useAws(config);
        break;

      default:
        if (!config.app.provider) {
          throw new Error('The deployment is missing a provider');
        } else {
          throw new Error(`The provider type ${config.app.provider} is invalid`);
        }
    }
  } catch (err) {
    let payload = { message: 'Failed to build deployment', details: err.message };
    producer.emit('deployment:failure', payload);
    producer.emit('deployment:finish');
    return;
  }

  producer.emit('deployment:progress', { message: `Application built. Deploying to hosting provider.` });

  try {
    info('Deploying configuration');
    let results = await build.deploy();
    info('Deployment completed');
    producer.emit('deployment:success', { message: 'Successfully deployed application', results });
  } catch (err) {
    error('Deployment failed to complete');
    producer.emit('deployment:failure', { message: 'Deployment failed to complete', details: err.message });
  }
  producer.emit('deployment:finish');
}

module.exports = processRequest;
