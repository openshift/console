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
    // t('olm~Modify {{item}}')
    titleKey: 'olm~Modify {{item}}',
    titleVariables: { item: specDescriptor.displayName },
    message: specDescriptor.description,
    path: `/spec/${getPatchPathFromDescriptor(specDescriptor)}`,
    // t('olm~Update {{item}}')
    buttonTextKey: 'olm~Update {{item}}',
    buttonTextVariables: { item: specDescriptor.displayName },
  });
};

type ConfigureSizeModalProps = {
  kindObj: K8sKind;
  resource: K8sResourceKind;
  specDescriptor: Descriptor;
  specValue: any;
};
