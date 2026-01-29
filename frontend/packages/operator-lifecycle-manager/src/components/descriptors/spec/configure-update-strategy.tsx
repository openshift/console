import { useCallback } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import i18n from '@console/internal/i18n';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { UpdateStrategyModalProvider } from '../../modals/update-strategy-modal';
import { Descriptor } from '../types';
import { getPatchPathFromDescriptor } from '../utils';

export const useConfigureUpdateStrategyModal = ({
  kindObj,
  resource,
  specDescriptor,
  specValue,
}: ConfigureUpdateStrategyModalProps) => {
  const launchOverlay = useOverlay();

  return useCallback(() => {
    return launchOverlay(UpdateStrategyModalProvider, {
      resourceKind: kindObj,
      resource,
      defaultValue: specValue,
      title: i18n.t('olm~Edit {{item}}', { item: specDescriptor.displayName }),
      path: `/spec/${getPatchPathFromDescriptor(specDescriptor)}`,
    });
  }, [launchOverlay, kindObj, resource, specValue, specDescriptor]);
};

type ConfigureUpdateStrategyModalProps = {
  kindObj: K8sKind;
  resource: K8sResourceKind;
  specDescriptor: Descriptor;
  specValue: any;
};
