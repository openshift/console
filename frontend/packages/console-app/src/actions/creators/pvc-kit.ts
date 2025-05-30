import * as React from 'react';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { clonePVCModal, expandPVCModal } from '@console/internal/components/modals';
import deletePVCModal from '@console/internal/components/modals/delete-pvc-modal';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, K8sModel } from '@console/internal/module/k8s';
import { ResourceActionsKit, PVCActionCreator, ResourceActionFactory } from './types';

/**
 * A React hook for creating actions related to a PersistentVolumeClaim (PVC).
 *
 * @param {K8sModel} kind - The K8s model for the PersistentVolumeClaim.
 * @param {PersistentVolumeClaimKind} obj - The specific PVC resource instance for which to generate actions.
 * @param {PVCActionCreator[]} [actionCreators] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all PVC actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 * @returns {ResourceActionsKit} An object containing both the action factory and the generated action(s).
 * - `factory`: Contains all possible action creators: `ExpandPVC`, `PVCSnapshot`, `ClonePVC`, `DeletePVC`.
 * - `actions`: An array containing the generated `Action` object(s).
 *
 * @example
 * // Getting all actions for PVC resource
 * const MyPVCComponent = ({ kind, obj }) => {
 * const { actions } = usePVCActionKit(kind, obj);
 * return <Kebab actions={actions} />;
 * };
 */
export const usePVCActionsKit = (
  kind: K8sModel,
  obj: PersistentVolumeClaimKind,
  filterActions?: PVCActionCreator[],
): ResourceActionsKit => {
  const { t } = useTranslation();
  const stableFilterActions = React.useRef(null);

  if (!isEqual(filterActions, stableFilterActions.current)) {
    stableFilterActions.current = filterActions;
  }

  const factory = React.useMemo<ResourceActionFactory>(
    () => ({
      ExpandPVC: (_kind: K8sModel, _obj: PersistentVolumeClaimKind) => ({
        id: 'expand-pvc',
        label: t('console-app~Expand PVC'),
        cta: () =>
          expandPVCModal({
            kind: _kind,
            resource: _obj,
          }),
        accessReview: asAccessReview(_kind, _obj, 'patch'),
      }),
      PVCSnapshot: (_kind: K8sModel, _obj: PersistentVolumeClaimKind) => ({
        id: 'create-snapshot',
        label: t('console-app~Create snapshot'),
        disabled: _obj?.status?.phase !== 'Bound',
        tooltip: _obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: {
          href: `/k8s/ns/${_obj.metadata.namespace}/${VolumeSnapshotModel.plural}/~new/form?pvc=${_obj.metadata.name}`,
        },
        accessReview: asAccessReview(_kind, _obj, 'create'),
      }),
      ClonePVC: (_kind: K8sModel, _obj: PersistentVolumeClaimKind) => ({
        id: 'clone-pvc',
        label: t('console-app~Clone PVC'),
        disabled: _obj?.status?.phase !== 'Bound',
        tooltip: _obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: () =>
          clonePVCModal({
            kind: _kind,
            resource: _obj,
          }),
        accessReview: asAccessReview(_kind, _obj, 'create'),
      }),
      DeletePVC: (_kind: K8sModel, _obj: PersistentVolumeClaimKind) => ({
        id: 'delete-pvc',
        label: t('public~Delete PersistentVolumeClaim'),
        cta: () =>
          deletePVCModal({
            pvc: _obj,
          }),
        accessReview: asAccessReview(_kind, _obj, 'delete'),
      }),
    }),
    [t],
  );
  // filter and initialize requested actions or construct list of all PVCActions
  const actions = React.useMemo<Action[]>(() => {
    if (stableFilterActions.current) {
      return stableFilterActions.current
        .map((creator) => factory[creator]?.(kind, obj))
        .filter(Boolean);
    }
    return [
      factory.ExpandPVC(kind, obj),
      factory.PVCSnapshot(kind, obj),
      factory.ClonePVC(kind, obj),
      factory.DeletePVC(kind, obj),
    ];
  }, [kind, obj, factory, stableFilterActions]);
  return {
    factory,
    actions,
  };
};
