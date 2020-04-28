import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';
import gql from 'graphql-tag';

const link = new WebSocketLink({
  uri: `${location.protocol === 'https:' ? 'wss://' : 'ws://'}${location.host}${
    window.SERVER_FLAGS.graphqlBaseURL
  }`,
  options: {
    reconnect: true,
  },
});

const client = new ApolloClient({ link, cache: new InMemoryCache() });

export default client;

const urlQuery = gql(`
  query q($url: String){
    urlFetch(url: $url)
  }
`);
export const fetchURL = <R = any>(url: String): Promise<R> =>
  client
    .query<{urlFetch: R}>({ query: urlQuery, variables: { url }, fetchPolicy: 'network-only' })
    .then((res) => res.data.urlFetch)
    .catch((err) => Promise.reject(err.graphQLErrors[0].extensions));
