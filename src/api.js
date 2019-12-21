const Router = require('@koa/router');
const queue = require('./queue')('requests');
const { using, handleQueueDeployRequest: queueDeployRequest } = require('./api.handlers');

const router = new Router({ prefix: '/api/v0' });

router.use(using(queue));

router.post('/deploy', queueDeployRequest);

module.exports = router;
