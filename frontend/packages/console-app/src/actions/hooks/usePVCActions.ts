import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ModifyVACModal } from '@console/app/src/components/modals/modify-vac-modal';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import {
  LazyClonePVCModalOverlay,
  LazyDeletePVCModalOverlay,
  LazyExpandPVCModalOverlay,
} from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { VolumeSnapshotModel, PersistentVolumeClaimModel } from '@console/internal/models';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
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
  const launchModal = useOverlay();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [PVCActionCreator.ExpandPVC]: () => ({
        id: 'expand-pvc',
        label: t('console-app~Expand PVC'),
        cta: () =>
          launchModal(LazyExpandPVCModalOverlay, {
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
        cta: () => launchModal(LazyClonePVCModalOverlay, { resource: obj }),
        accessReview: asAccessReview(PersistentVolumeClaimModel, obj, 'create'),
      }),
      [PVCActionCreator.ModifyVAC]: () => ({
        id: 'modify-vac',
        label: t('console-app~Modify VolumeAttributesClass'),
        disabled: obj?.status?.phase !== 'Bound',
        tooltip:
          obj?.status?.phase !== 'Bound'
            ? t('console-app~PVC must be Bound to modify VolumeAttributesClass')
            : '',
        cta: () => launchModal(ModifyVACModal, { resource: obj }),
        accessReview: asAccessReview(PersistentVolumeClaimModel, obj, 'patch'),
      }),
      [PVCActionCreator.DeletePVC]: () => ({
        id: 'delete-pvc',
        label: t('public~Delete PersistentVolumeClaim'),
        cta: () => launchModal(LazyDeletePVCModalOverlay, { pvc: obj }),
        accessReview: asAccessReview(PersistentVolumeClaimModel, obj, 'delete'),
      }),
    }),
    [t, obj, launchModal],
  );

  // filter and initialize requested actions or construct list of all PVCActions
  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [
      factory.ExpandPVC(),
      factory.PVCSnapshot(),
      factory.ClonePVC(),
      factory.ModifyVAC(),
      factory.DeletePVC(),
    ];
  }, [factory, memoizedFilterActions]);
  return actions;
};
