import { TFunction } from 'i18next';
import { K8sKind } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { Kebab } from '@console/internal/components/utils';
import { addCapacityModal } from '../modals/add-capacity-modal/add-capacity-modal';
import { OCSServiceModel } from '../../models';

const addStorage = (kind: K8sKind, resource: K8sResourceKind, _, customData) => {
  const t: TFunction = customData?.tFunction;
  return {
    labelKey: t('ceph-storage-plugin~Add Capacity'),
    callback: () => addCapacityModal({ kind, ocsConfig: resource }),
  };
};

export const getGenericActions = () => [...Kebab.factory.common];

export const getActionsForOCS = () => [addStorage, ...getGenericActions()];

export const getActions = (kind: string) => {
  if (referenceForModel(OCSServiceModel).toLowerCase() === kind.toLowerCase())
    return getActionsForOCS();
  return getGenericActions();
};
