import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotModel } from '@console/internal/models';
import { VolumeSnapshotKind } from '@console/internal/module/k8s';
import { useRestorePVCModal } from '../../components/modals/restore-pvc/restore-pvc-modal';
import { VolumeSnapshotActionCreator } from './types';

/**
 * A React hook for retrieving actions related to VolumeSnapshots(VS).
 *
 * @param {VolumeSnapshotKind} resource - The specific VS resource instance for which to generate actions.
 * @param {VolumeSnapshotActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain only
 * the specified actions. If omitted, it will contain all VS actions. In case of unknown `actionCreators` returns empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {Action[]} An array containing the generated action(s).
 *
 * @example
 * // Getting all actions for VS resources
 * const MyVolumeSnapshotComponent = ({ resource }) => {
 *   const actions = useVolumeSnapshotActions(resource);
 *   return <Kebab actions={actions} />;
 * };
 */
export const useVolumeSnapshotActions = (
  resource: VolumeSnapshotKind,
  filterActions?: VolumeSnapshotActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const restorePVCModalLauncher = useRestorePVCModal({
    resource,
  });

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [VolumeSnapshotActionCreator.RestorePVC]: () => ({
        id: 'clone-pvc',
        label: t('console-app~Restore as new PVC'),
        disabled: !resource?.status?.readyToUse,
        tooltip: !resource?.status?.readyToUse ? t('console-app~Volume Snapshot is not Ready') : '',
        cta: () => restorePVCModalLauncher(),
        accessReview: asAccessReview(VolumeSnapshotModel, resource, 'create'),
      }),
    }),
    [t, resource, restorePVCModalLauncher],
  );

  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [factory.RestorePVC()];
  }, [factory, memoizedFilterActions]);
  return actions;
};
