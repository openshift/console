import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-link';

import { getK8sResourcePath } from '../module/k8s/resource';
import { K8sKind, K8sResourceCommon } from '../module/k8s/types';
import { URLQuery } from './client.gql';
import { URLQueryType, URLQueryVariables } from '../../@types/gql/schema';
import { getImpersonateHeaders, coFetch } from '../co-fetch';

let wssErrors = 0;

class GraphQLReady {
  private callback: VoidFunction;
  private ready: boolean;
  private wasCalled: boolean;

  setReady() {
    this.ready = true;
    if (!this.wasCalled && this.callback) {
      this.wasCalled = true;
      this.callback();
    }
  }

  onReady(cb: VoidFunction) {
    this.callback = cb;
    if (this.ready && !this.wasCalled) {
      this.wasCalled = true;
      this.callback();
    }
  }
}

export const graphQLReady = new GraphQLReady();

export const subsClient = new SubscriptionClient(
  `${location.protocol === 'https:' ? 'wss://' : 'ws://'}${location.host}${
    window.SERVER_FLAGS.graphqlBaseURL
  }`,
  {
    reconnect: true,
    connectionParams: getImpersonateHeaders,
    reconnectionAttempts: 5,
    connectionCallback: () => {
      graphQLReady.setReady();
      wssErrors = 0;
    },
  },
);

subsClient.onError(() => {
  wssErrors++;
  if (wssErrors > 4) {
    graphQLReady.setReady();
  }
});

const httpLink = new HttpLink({
  uri: window.SERVER_FLAGS.graphqlBaseURL,
  fetch: coFetch,
});

const wsLink = new WebSocketLink(subsClient);

// fallback to http connection if websocket connection was not successful
// iOS does not allow wss with self signed certificate
const link = split(() => wssErrors > 4, httpLink, wsLink);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
    },
    mutate: {
      fetchPolicy: 'network-only',
    },
    watchQuery: {
      fetchPolicy: 'network-only',
    },
  },
});

export default client;

export const fetchURL = async <R = any>(url: string): Promise<R> => {
  try {
    const response = await client.query<URLQueryType, URLQueryVariables>({
      query: URLQuery,
      variables: { url },
    });
    return JSON.parse(response.data.fetchURL);
  } catch (err) {
    return Promise.reject({ response: err.graphQLErrors[0]?.extensions });
  }
};

export const fetchK8s = <R extends K8sResourceCommon = K8sResourceCommon>(
  kind: K8sKind,
  name?: string,
  ns?: string,
  path?: string,
  queryParams?: { [key: string]: string },
): Promise<R> => fetchURL<R>(getK8sResourcePath(kind, { ns, name, path, queryParams }));
