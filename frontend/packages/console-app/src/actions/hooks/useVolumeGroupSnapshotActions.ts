import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { LazyRestoreVolumeGroupSnapshotModalOverlay } from '@console/internal/components/modals/lazy-restore-volume-group-snapshot-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import type { VolumeGroupSnapshotKind } from '@console/internal/module/k8s';
import { VolumeGroupSnapshotActionCreator } from './types';

/**
 * A React hook for retrieving actions related to VolumeGroupSnapshots(VGS).
 *
 * @param {VolumeGroupSnapshotKind} resource - The specific VGS resource instance for which to generate actions.
 * @param {VolumeGroupSnapshotActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain only
 * the specified actions. If omitted, it will contain all VGS actions. In case of unknown `actionCreators` returns empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {Action[]} An array containing the generated action(s).
 *
 * @example
 * // Getting all actions for VGS resources
 * const MyVolumeGroupSnapshotComponent = ({ resource }) => {
 *   const actions = useVolumeGroupSnapshotActions(resource);
 *   return <Kebab actions={actions} />;
 * };
 */
export const useVolumeGroupSnapshotActions = (
  resource: VolumeGroupSnapshotKind,
  filterActions?: VolumeGroupSnapshotActionCreator[],
): Action[] => {
  const { t } = useTranslation('console-app');
  const launchModal = useOverlay();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [VolumeGroupSnapshotActionCreator.RestorePVCs]: () => ({
        id: 'restore-group-snapshot-pvcs',
        label: t('Restore as new PVCs'),
        disabled: !resource?.status?.readyToUse,
        tooltip: !resource?.status?.readyToUse ? t('VolumeGroupSnapshot is not Ready') : '',
        cta: () =>
          launchModal(LazyRestoreVolumeGroupSnapshotModalOverlay, {
            resource,
          }),
        accessReview: asAccessReview(PersistentVolumeClaimModel, resource, 'create'),
      }),
    }),
    [t, resource, launchModal],
  );

  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [factory.RestorePVCs()];
  }, [factory, memoizedFilterActions]);
  return actions;
};
