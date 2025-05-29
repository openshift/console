import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { clonePVCModal, expandPVCModal } from '@console/internal/components/modals';
import deletePVCModal from '@console/internal/components/modals/delete-pvc-modal';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, K8sModel } from '@console/internal/module/k8s';
import { PVCActionCreator } from './types';

/**
 * A React hook for retrieving actions related to a PersistentVolumeClaim (PVC).
 *
 * @param {K8sModel} kind - The K8s model for the PersistentVolumeClaim.
 * @param {PersistentVolumeClaimKind} obj - The specific PVC resource instance for which to generate actions.
 * @param {PVCActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all PVC actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 * @returns {Action[]} An array containing the generated action(s).
 *
 * @example
 * // Getting ExpandPVC and PVCSnapshot actions for PVC resource
 * const MyPVCComponent = ({ kind, obj }) => {
 * const actions = usePVCActions(kind, obj, [PVCActionCreator.ExpandPVC, PVCActionCreator.PVCSnapshot]);
 * return <Kebab actions={actions} />;
 * };
 */
export const usePVCActions = (
  kind: K8sModel,
  obj: PersistentVolumeClaimKind,
  filterActions?: PVCActionCreator[],
): Action[] => {
  const { t } = useTranslation();

  const factory = React.useMemo(
    () => ({
      ExpandPVC: () => ({
        id: 'expand-pvc',
        label: t('console-app~Expand PVC'),
        cta: () =>
          expandPVCModal({
            kind,
            resource: obj,
          }),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
      PVCSnapshot: () => ({
        id: 'create-snapshot',
        label: t('console-app~Create snapshot'),
        disabled: obj?.status?.phase !== 'Bound',
        tooltip: obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: {
          href: `/k8s/ns/${obj.metadata.namespace}/${VolumeSnapshotModel.plural}/~new/form?pvc=${obj.metadata.name}`,
        },
        accessReview: asAccessReview(kind, obj, 'create'),
      }),
      ClonePVC: () => ({
        id: 'clone-pvc',
        label: t('console-app~Clone PVC'),
        disabled: obj?.status?.phase !== 'Bound',
        tooltip: obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: () =>
          clonePVCModal({
            kind,
            resource: obj,
          }),
        accessReview: asAccessReview(kind, obj, 'create'),
      }),
      DeletePVC: () => ({
        id: 'delete-pvc',
        label: t('public~Delete PersistentVolumeClaim'),
        cta: () =>
          deletePVCModal({
            pvc: obj,
          }),
        accessReview: asAccessReview(kind, obj, 'delete'),
      }),
    }),
    [t, kind, obj],
  );

  // filter and initialize requested actions or construct list of all PVCActions
  const actions = React.useMemo<Action[]>(() => {
    if (filterActions) {
      return filterActions.map((creator) => factory[creator]?.()).filter(Boolean);
    }
    return [factory.ExpandPVC(), factory.PVCSnapshot(), factory.ClonePVC(), factory.DeletePVC()];
  }, [factory, filterActions]);
  return actions;
};
