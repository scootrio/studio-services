'use strict';

const Hapi = require('@hapi/hapi');
const Yar = require('@hapi/yar');
const Queue = require('./plugins/queue');
const Logger = require('hapi-pino');
const logger = require('./util/logger');
const routes = require('./routes');
const queue = require('./util/queue');
const processRequests = require('./deploy');

const port = process.env.STUDIO_SERVICES_PORT || 3030;
const host = process.env.STUDIO_SERVICES_HOST || 'localhost';

const sessionPassword = process.env.STUDIO_SERVICES_SESSION_PASSWORD;
if (!sessionPassword || sessionPassword.length < 32) {
  error('Studio Services requires a password to encrypt session cookes. The password must be at least 32 characters.');
  process.exit(1);
}

(async function() {
  const server = Hapi.server({
    port,
    host,
    routes: {
      cors: {
        credentials: true
      }
    }
  });

  await server.register([
    // Session Management
    //
    {
      plugin: Yar,
      options: {
        name: 'studio-services.session',
        storeBlank: false,
        cookieOptions: {
          password: sessionPassword,
          isSecure: process.env.NODE_ENV !== 'development'
        }
      }
    },

    // Job Queue
    //
    {
      plugin: Queue
    },

    // Logging
    //
    {
      plugin: Logger,
      options: {
        name: 'studio-services',
        level: process.env.STUDIO_SERVICES_LOG_LEVEL || 'info'
      }
    }
  ]);

  // Route Registration
  //
  for (let route of routes) {
    server.route(route);
  }

  // Start our "background" process that will be handling deployment requests
  //
  const requests = queue('requests');
  requests.process(processRequests);

  // Startup the server and get things going
  //
  try {
    await server.start();
  } catch (err) {
    logger.error('Failed to start Studio Services: ' + err.message);
  }
})();
