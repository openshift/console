import { K8sResourceCommon, WatchK8sResults } from '@console/dynamic-plugin-sdk';

export const getPrimaryUDN = (
  udnByNamespaces: WatchK8sResults<{ [key: string]: Array<K8sResourceCommon & { spec: any }> }>,
  namespace: string,
) => udnByNamespaces?.[namespace]?.data?.find((udn) => udn?.spec?.layer2?.role === 'Primary');
