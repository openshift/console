import {
  referenceForGroupVersionKind,
  referenceForModel,
  WatchK8sResources,
} from '@console/internal/module/k8s';
import { ServiceBindingModel } from '@console/topology/src/models';
import { fetchBindableServices, getBindableServicesList } from './fetch-bindable-services-utils';

// Used to perform discovery of bindable services on console load since topology data model loader requires models upfront
fetchBindableServices();

export const getBindableServiceResources = (namespace: string): WatchK8sResources<any> => {
  const resources = {
    serviceBindingRequests: {
      namespace,
      kind: referenceForModel(ServiceBindingModel),
      isList: true,
      optional: true,
      prop: 'serviceBindingRequests',
    },
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
