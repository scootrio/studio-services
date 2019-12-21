function using(queue) {
  return async function(ctx, next) {
    ctx.current = {
      id: ctx.session.id,
      queue
    };
    await next();
  };
}

async function handleQueueDeployRequest(ctx) {
  ctx.queue.push({ id: ctx.current.id, config: ctx.request.body });
  ctx.status = 200;
  ctx.body = {
    message: 'Request has been queued for processing'
  };
}

module.exports = {
  using,
  handleQueueDeployRequest
};
