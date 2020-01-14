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
const { info, error } = require('../logger');
const eventstream = require('../eventstream');
const queue = require('../queue');
const useAws = require('./aws');

const requests = queue('requests');

async function processRequest({ id, config }) {
  const producer = eventstream(id);

  producer.emit('deploy:progress', { message: 'Building application' });

  let build = null;
  switch (config.app.provider) {
    case 'aws':
      build = useAws(config);
      break;

    default:
    // TODO: throw an error
  }

  producer.emit('deploy:progress', { message: `Application built. Deploying with provider '${config.app.provider}'` });

  // Deploy
  try {
    info('Deploying configuration');
    let results = await build.app.deploy(build.driver, config.app.region);
    info('Deployment completed');
    producer.emit('deploy:done', { message: 'Successfully deployed configuration', results });
  } catch (err) {
    error('Deployment failed to complete');
    producer.emit('deploy:error', { message: 'Deployment failed to complete', details: err.message });
  }
}

requests.process(processRequest);
