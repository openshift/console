import {
  referenceForGroupVersionKind,
  referenceForModel,
  WatchK8sResourcesOptional,
} from '@console/internal/module/k8s';
import { ServiceBindingModel } from '@console/service-binding-plugin/src/models';
import { getBindableServicesList } from './fetch-bindable-services-utils';

export const getBindableServiceResources = (namespace: string): WatchK8sResourcesOptional<any> => {
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
