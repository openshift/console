import { configureCountModal } from '../../../modals';
import { K8sResourceKind, K8sKind } from '../../../../module/k8s';
import { Descriptor } from '../types';

export const configureSizeModal = ({kindObj, resource, specDescriptor, specValue}: ConfigureSizeModalProps) => {
  return configureCountModal({
    resourceKind: kindObj,
    resource,
    defaultValue: specValue || 0,
    title: `Modify ${specDescriptor.displayName}`,
    message: specDescriptor.description,
    path: `/spec/${specDescriptor.path}`,
    buttonText: `Update ${specDescriptor.displayName}`,
  });
};

type ConfigureSizeModalProps = {
  kindObj: K8sKind;
  resource: K8sResourceKind;
  specDescriptor: Descriptor;
  specValue: any;
};
