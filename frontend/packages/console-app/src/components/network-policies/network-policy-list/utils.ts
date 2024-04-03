import { Location } from 'react-router-dom-v5-compat';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { multiNetworkPolicyRef, TAB_INDEXES } from './constants';

export const getActiveKeyFromPathname = (location: Location) => {
  const pathname = location?.pathname;

  if (pathname.endsWith(multiNetworkPolicyRef)) return TAB_INDEXES.MULTI_NETWORK;

  if (pathname.includes('~enable-multi')) return TAB_INDEXES.ENABLE_MULTI;

  const queryParams = new URLSearchParams(location?.search);

  if (queryParams.get('kind')?.includes(multiNetworkPolicyRef)) return TAB_INDEXES.MULTI_NETWORK;

  return TAB_INDEXES.NETWORK;
};

export const buildNSPath = (namespace: string): string =>
  ['all-namespaces', ALL_NAMESPACES_KEY].includes(namespace) ? 'all-namespaces' : `ns/${namespace}`;

export const isDisplayedInDeveloperSearchPage = (pathname: string) =>
  pathname.includes('search-page');
