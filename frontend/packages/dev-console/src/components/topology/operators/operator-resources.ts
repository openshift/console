import { FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceBindingModel } from '../../../models';

export const operatorResources = (namespace: string): FirehoseResource[] => {
  const serviceBindings = [
    {
      isList: true,
      kind: referenceForModel(ServiceBindingModel),
      namespace,
      prop: 'serviceBindings',
      optional: true,
    },
  ];
  return serviceBindings;
};
