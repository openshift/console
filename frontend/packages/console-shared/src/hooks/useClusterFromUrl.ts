import { useRouteMatch } from 'react-router-dom';
import { CLUSTER_ROUTE_PREFIX } from '../constants';

// Captures the cluster name from the URL using react-router useRouteMatch hook.
export const useClusterFromUrl = (): string =>
  useRouteMatch<{ cluster: string }>({
    path: CLUSTER_ROUTE_PREFIX,
  })?.params?.cluster;
