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
        .keytype(s.keyType);
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
    internalEvents[ie.id] = scootr
      .topic(ie.id)
      .broker(enums.Brokers.SNS)
      .name(ie.name);
  }

  for (let t of config.triggers) {
    if (externalEvents[t.source]) {
      compute[t.target].on(externalEvents[t.source]);
    } else if (internalEvents[t.source]) {
      compute[t.target].on(internalEvents[t.source]);
    } else {
      // TODO: throw an error
    }
  }

  for (let r of config.references) {
    if (storage[r.target]) {
      compute[r.source].use(storage[r.target], r.allows.map(mapAction), r.id);
    } else if (internalEvents[r.target]) {
      compute[r.source].use(internalEvents[r.target], r.allows.map(mapAction), r.id);
    } else {
      // TODO: throw an error
    }
  }

  const app = scootr.application(config.app.name);

  app.withAll(Array.from(Object.values(compute)));

  return {
    deploy: async function() {
      // Deploy our application and get the driver result
      const result = await app.deploy(driver, config.app.region);

      // Map our driver result back into configuration to give back to the client
      const results = {
        app: {},
        compute: [],
        storage: [],
        events: {
          internal: [],
          external: []
        },
        triggers: [],
        references: []
      };

      // Start by mapping our metadata from the driver result
      results.app = result.meta;

      // We need to get the URLs of all our external HTTP events so that we can send them back to the client
      for (let event of result.events) {
        if (event.type === 'http') {
          // Find the ID of the event that has the matching path and method and add it to our result set
          let ee = config.events.external.find(e => e.path === event.path && e.method.toLowerCase() === event.method);
          results.events.external.push({
            id: ee.id,
            url: event.url,
            method: event.method
          });
        } else {
          // TODO: handle other event types (none yet to worry about)
        }
      }

      // Now we need to get the actual name of the resource that was deployed on AWS for each of our compute instances
      results.compute = [...result.compute];

      // Send it off!
      return results;
    }
  };
}

function mapAction(a) {
  switch (a) {
    case 'create':
      return scootr.actions.Create;
    case 'read':
      return scootr.actions.Read;
    case 'update':
      return scootr.actions.Update;
    case 'delete':
      return scootr.actions.Delete;
    case '*':
      return scootr.actions.All;
    default:
      throw new Error(`Failed to build application: The action '${a.toString()}' is not valid.`);
  }
}

module.exports = useAws;
