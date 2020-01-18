const pino = require('pino');

let level = 'info';
if (process.env.STUDIO_SERVICES_LOG_SILENT) {
  level = 'silent';
} else if (process.env.STUDIO_SERVICES_LOG_LEVEL) {
  level = process.env.STUDIO_SERVICES_LOG_LEVEL;
}

const logger = pino({
  name: 'studio-services-processor',
  level
});

module.exports = logger;
