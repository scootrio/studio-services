const Router = require('@koa/router');
const subsciptions = require('./subscribe');
const deployments = require('./deploy');

const router = new Router({ prefix: '/api/v0' });

router.use(subsciptions.routes()).use(subsciptions.allowedMethods());
router.use(deployments.routes()).use(deployments.allowedMethods());

module.exports = router;
