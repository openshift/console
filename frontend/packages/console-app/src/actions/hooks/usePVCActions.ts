import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { clonePVCModal, expandPVCModal } from '@console/internal/components/modals';
import deletePVCModal from '@console/internal/components/modals/delete-pvc-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { VolumeSnapshotModel, PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { PVCActionCreator } from './types';

/**
 * A React hook for retrieving actions related to a PersistentVolumeClaim (PVC).
 *
 * @param {PersistentVolumeClaimKind} obj - The specific PVC resource instance for which to generate actions.
 * @param {PVCActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all PVC actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {Action[]} An array containing the generated action(s).
 *
 * @example
 * // Getting ExpandPVC and PVCSnapshot actions for PVC resource
 * const MyPVCComponent = ({ obj }) => {
 *   const actions = usePVCActions(obj, [PVCActionCreator.ExpandPVC, PVCActionCreator.PVCSnapshot]);
 *   return <Kebab actions={actions} />;
 * };
 */
export const usePVCActions = (
  obj: PersistentVolumeClaimKind,
  filterActions?: PVCActionCreator[],
): Action[] => {
  const { t } = useTranslation();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [PVCActionCreator.ExpandPVC]: () => ({
        id: 'expand-pvc',
        label: t('console-app~Expand PVC'),
        cta: () =>
          expandPVCModal({
            kind: PersistentVolumeClaimModel,
            resource: obj,
          }),
        accessReview: asAccessReview(PersistentVolumeClaimModel, obj, 'patch'),
      }),
      [PVCActionCreator.PVCSnapshot]: () => ({
        id: 'create-snapshot',
        label: t('console-app~Create snapshot'),
        disabled: obj?.status?.phase !== 'Bound',
        tooltip: obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: {
          href: `/k8s/ns/${obj.metadata?.namespace}/${VolumeSnapshotModel.plural}/~new/form?pvc=${obj.metadata?.name}`,
        },
        accessReview: asAccessReview(PersistentVolumeClaimModel, obj, 'create'),
      }),
      [PVCActionCreator.ClonePVC]: () => ({
        id: 'clone-pvc',
        label: t('console-app~Clone PVC'),
        disabled: obj?.status?.phase !== 'Bound',
        tooltip: obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: () =>
          clonePVCModal({
            kind: PersistentVolumeClaimModel,
            resource: obj,
          }),
        accessReview: asAccessReview(PersistentVolumeClaimModel, obj, 'create'),
      }),
      [PVCActionCreator.DeletePVC]: () => ({
        id: 'delete-pvc',
        label: t('public~Delete PersistentVolumeClaim'),
        cta: () =>
          deletePVCModal({
            pvc: obj,
          }),
        accessReview: asAccessReview(PersistentVolumeClaimModel, obj, 'delete'),
      }),
    }),
    [t, obj],
  );

  // filter and initialize requested actions or construct list of all PVCActions
  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [factory.ExpandPVC(), factory.PVCSnapshot(), factory.ClonePVC(), factory.DeletePVC()];
  }, [factory, memoizedFilterActions]);
  return actions;
};
