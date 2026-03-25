import type { WatchK8sResources } from '@console/internal/module/k8s';
import { referenceForGroupVersionKind } from '@console/internal/module/k8s';
import { getBindableServicesList } from './fetch-bindable-services-utils';

export const getBindableServiceResources = (namespace: string): WatchK8sResources<any> => {
  const resources = {
    ...getBindableServicesList().reduce(
      (acc, { group, version, kind }) => ({
        [kind]: {
          namespace,
          kind: referenceForGroupVersionKind(group)(version)(kind),
          isList: true,
          optional: true,
          prop: kind,
        },
        ...acc,
      }),
      {},
    ),
  };
  return resources;
};
