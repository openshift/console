import { FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceBindingRequestModel } from '../../../models';

export const operatorResources = (namespace: string): FirehoseResource[] => {
  const serviceBindings = [
    {
      isList: true,
      kind: referenceForModel(ServiceBindingRequestModel),
      namespace,
      prop: 'serviceBindingRequests',
      optional: true,
    },
  ];
  return serviceBindings;
};
