import { useCallback } from 'react';
import { useConfigureCountModal } from '@console/internal/components/modals/configure-count-modal';
import type { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import type { Descriptor } from '../types';
import { getPatchPathFromDescriptor } from '../utils';

export const useConfigureSizeModal = ({
  kindObj,
  resource,
  specDescriptor,
  specValue,
}: ConfigureSizeModalProps) => {
  const launchConfigureCountModal = useConfigureCountModal({
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

  return useCallback(() => {
    launchConfigureCountModal();
  }, [launchConfigureCountModal]);
};

type ConfigureSizeModalProps = {
  kindObj: K8sKind;
  resource: K8sResourceKind;
  specDescriptor: Descriptor;
  specValue: any;
};
