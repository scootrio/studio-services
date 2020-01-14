const scootr = require('scootr');
const { driver, enums } = require('scootr-aws');

function useAws(config) {
  const compute = {};
  const storage = {};
  const internalEvents = {};
  const externalEvents = {};

  for (let c of config.compute) {
    compute[c.id] = scootr
      .compute(c.id)
      .runtime(c.runtime)
      .code(c.code);
  }

  for (let s of config.storage) {
    if (s.type === 'keyval') {
      storage[s.id] = scootr
        .storage(s.id, scootr.types.KeyValueStorage)
        .engine(enums.Storage.DynamoDb)
        .collection(s.name)
        .key(s.keyName)
        .type(s.keyType);
    } else if (s.type === 'relational') {
      // TODO: implement relational storage
    } else {
      // TODO: throw an error
    }
  }

  for (let ee of config.events.external) {
    if (ee.type === 'http') {
      externalEvents[ee.id] = scootr
        .http(ee.id)
        .path(ee.path)
        .method(ee.method);
    } else {
      // TODO: throw an error
    }
  }

  for (let ie of config.events.internal) {
    // TODO: add support for internal events
  }

  for (let t of config.triggers) {
    compute[t.target].on(externalEvents[t.source]);
    // TODO: add support for internal events
  }

  for (let r of config.references) {
    if (t.type === 'storage') {
      compute[r.source].use(storage[r.target], [r.allow], r.id);
    } else if (t.type === 'topic') {
      // TODO: implement internal events
    } else {
      // TODO: throw an error
    }
  }

  const app = scootr.application(config.app.name);

  app.withAll(Array.from(Object.values(compute)));

  return { app, driver };
}

module.exports = useAws;
