import { configureCountModal } from '@console/internal/components/modals';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { Descriptor } from '../types';
import { getPatchPathFromDescriptor } from '../utils';

export const configureSizeModal = ({
  kindObj,
  resource,
  specDescriptor,
  specValue,
}: ConfigureSizeModalProps) => {
  return configureCountModal({
    resourceKind: kindObj,
    resource,
    defaultValue: specValue || 0,
    title: `Modify ${specDescriptor.displayName}`,
    message: specDescriptor.description,
    path: `/spec/${getPatchPathFromDescriptor(specDescriptor)}`,
    buttonText: `Update ${specDescriptor.displayName}`,
  });
};

type ConfigureSizeModalProps = {
  kindObj: K8sKind;
  resource: K8sResourceKind;
  specDescriptor: Descriptor;
  specValue: any;
};
