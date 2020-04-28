import { createServer as createHttpsServer } from 'https';
import { createServer } from 'http';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import * as fs from 'fs';
import * as compression from 'compression';

import resolvers from './schema';
import typeDefs from './typeDef';
import K8sDS from './datasource/k8s-ds';

const app = express();
app.use(compression());

const options = process.env['service-ca-file']
  ? {
      ca: fs.readFileSync(process.env['service-ca-file']),
      key: fs.readFileSync('/var/serving-cert/tls.key'),
      cert: fs.readFileSync('/var/serving-cert/tls.crt'),
    }
  : null;

const constructDataSourcesForSubscriptions = (context) => {
  const initializeDataSource = (DataSourceClass) => {
    const instance = new DataSourceClass(!options);
    instance.initialize({ context, cache: undefined });
    return instance;
  };

  const k8sDS = initializeDataSource(K8sDS);

  return {
    k8sDS,
  };
};

const graphQLServer = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({ k8sDS: new K8sDS(!options) }),
  subscriptions: {
    onConnect: (connectionParams, webSocket) => {
      // @ts-ignore
      return { token: webSocket.upgradeReq.headers.authorization };
    },
  },
  context: ({ req, connection }) => {
    const token = connection
      ? connection.context.token
      : req.headers?.Authorization || req.headers?.authorization;
    if (connection) {
      return {
        dataSources: constructDataSourcesForSubscriptions(connection.context),
        token,
      };
    }
    return { token };
  },
});

graphQLServer.applyMiddleware({ app, path: '/graphql/' });
const server = options ? createHttpsServer(options, app) : createServer(app);

graphQLServer.installSubscriptionHandlers(server);

server.listen({ port: 4000 }, () => {
  console.log(`Apollo Server on ${options ? 'https' : 'http'}://localhost:4000/graphql/`);
});
