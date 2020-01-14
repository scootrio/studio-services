const Router = require('@koa/router');
const queue = require('../queue')('requests');
const { using, handleQueueDeployRequest: queueDeployRequest } = require('./deploy.handlers.js');

const router = new Router();

router.use(using(queue));

router.post('/deploy', queueDeployRequest);

module.exports = router;
