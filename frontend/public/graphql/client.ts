import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';

import { getK8sResourcePath } from '../module/k8s/resource';
import { K8sKind, K8sResourceCommon } from '../module/k8s/types';
import { URLQuery } from './client.gql';
import { URLQueryType, URLQueryVariables } from '../../@types/gql/schema';

const link = new WebSocketLink({
  uri: `${location.protocol === 'https:' ? 'wss://' : 'ws://'}${location.host}${
    window.SERVER_FLAGS.graphqlBaseURL
  }`,
  options: {
    reconnect: true,
  },
});

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
    return Promise.reject({ response: err.graphQLErrors[0].extensions });
  }
};

export const fetchK8s = <R extends K8sResourceCommon = K8sResourceCommon>(
  kind: K8sKind,
  name?: string,
  ns?: string,
  path?: string,
  queryParams?: { [key: string]: string },
): Promise<R> => fetchURL<R>(getK8sResourcePath(kind, { ns, name, path, queryParams }));
