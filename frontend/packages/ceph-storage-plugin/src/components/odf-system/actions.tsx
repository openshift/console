import { TFunction } from 'i18next';
import { K8sKind } from '@console/dynamic-plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { Kebab } from '@console/internal/components/utils';
import { addSSCapacityModal } from '../modals/add-capacity-modal/add-capacity-modal';
import { OCSServiceModel } from '../../models';
import { StorageSystemKind } from '../../types';

const addStorage = (kind: K8sKind, resource: StorageSystemKind, _, customData) => {
  const t: TFunction = customData?.tFunction;
  return {
    labelKey: t('ceph-storage-plugin~Add Capacity'),
    callback: () => addSSCapacityModal({ storageSystem: resource }),
  };
};

export const getGenericActions = () => [...Kebab.factory.common];

export const getActionsForOCS = () => [addStorage, ...getGenericActions()];

export const getActions = (kind: string, isMCGOrExternal: boolean) => {
  if (referenceForModel(OCSServiceModel).toLowerCase() === kind.toLowerCase() && !isMCGOrExternal)
    return getActionsForOCS();
  return getGenericActions();
};
