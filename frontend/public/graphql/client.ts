import { getK8sResourcePath } from '../module/k8s';
import { K8sModel, K8sResourceCommon } from '../module/k8s/types';
import { URLQuery } from './client.gql';
import { URLQueryType, URLQueryVariables } from '../../@types/console/generated/graphql-schema';

import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-link';

import { getConsoleRequestHeaders, coFetch } from '../co-fetch';

export let client: ApolloClient<NormalizedCacheObject>;
let subsClient: SubscriptionClient;

export const startGQLClient = (cluster: string, onReady?: VoidFunction) => {
  subsClient?.close(true, false);
  let wssErrors = 0;
  subsClient = new SubscriptionClient(
    `${location.protocol === 'https:' ? 'wss://' : 'ws://'}${location.host}${
      window.SERVER_FLAGS.graphqlBaseURL
    }?cluster=${cluster}`,
    {
      reconnect: true,
      connectionParams: () => getConsoleRequestHeaders() || {},
      reconnectionAttempts: 5,
      connectionCallback: () => {
        onReady?.();
        wssErrors = 0;
      },
    },
  );

  subsClient.onError(() => {
    wssErrors++;
    if (wssErrors > 4) {
      onReady?.();
    }
  });

  const httpLink = new HttpLink({
    uri: window.SERVER_FLAGS.graphqlBaseURL,
    fetch: (url: string, options) => {
      const headers = getConsoleRequestHeaders(cluster);
      return coFetch(url, { ...options, headers });
    },
  });

  const wsLink = new WebSocketLink(subsClient);

  // fallback to http connection if websocket connection was not successful
  // iOS does not allow wss with self signed certificate
  const link = split(() => wssErrors > 4, httpLink, wsLink);

  client = new ApolloClient({
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
};

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
  kind: K8sModel,
  name?: string,
  ns?: string,
  path?: string,
  queryParams?: { [key: string]: string },
): Promise<R> => fetchURL<R>(getK8sResourcePath(kind, { ns, name, path, queryParams }));
