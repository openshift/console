/* eslint-disable no-undef, no-unused-vars */

import { configureCountModal } from '../../modals';
import { K8sResourceKind, K8sKind } from '../../../module/k8s';
import { SpecDescriptor } from '../spec-descriptors';

export const configureSizeModal: ConfigureSizeModal = (kindObj, resource, specDescriptor, specValue, wasChanged) => {
  return configureCountModal({
    resourceKind: kindObj,
    resource: resource,
    defaultValue: specValue || 0,
    title: `Modify ${specDescriptor.displayName}`,
    message: specDescriptor.description,
    path: `/spec/${specDescriptor.path}`,
    buttonText: `Update ${specDescriptor.displayName}`,
    invalidateState: (isInvalid) => {
      // NOTE: Necessary until https://github.com/kubernetes/kubernetes/pull/53345 fixes WebSocket loading of the custom resources.
      if (isInvalid) {
        wasChanged();
      }
    },
  });
};

type ConfigureSizeModal = (kindObj: K8sKind, resource: K8sResourceKind, specDescriptor: SpecDescriptor, specValue: any, wasChanged: () => Promise<any>) => {result: Promise<any>};
