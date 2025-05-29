import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { restorePVCModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotKind, K8sModel } from '@console/internal/module/k8s';
import { VolumeSnapshotActionCreator } from './types';

/**
 * A React hook for retrieving actions related to VolumeSnapshots(VS).
 *
 * @param {K8sModel} kind - The K8s model for the VS.
 * @param {VolumeSnapshotKind} obj - The specific VS resource instance for which to generate actions.
 * @param {VolumeSnapshotActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain only
 * the specified actions. If omitted, it will contain all VS actions. In case of unknown `actionCreators` returns empty array.
 *
 * @returns {Action[]} An array containing the generated action(s).
 *
 * @example
 * // Getting all actions for VS resources
 * const MyVolumeSnapshotComponent = ({ kind, obj }) => {
 * const actions = useVolumeSnapshotActions(kind, obj);
 * return <Kebab actions={actions} />;
 * };
 */
export const useVolumeSnapshotActions = (
  kind: K8sModel,
  obj: VolumeSnapshotKind,
  filterActions?: VolumeSnapshotActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const factory = React.useMemo(
    () => ({
      RestorePVC: () => ({
        id: 'clone-pvc',
        label: t('console-app~Restore as new PVC'),
        disabled: !obj?.status?.readyToUse,
        tooltip: !obj?.status?.readyToUse ? t('console-app~Volume Snapshot is not Ready') : '',
        cta: () =>
          restorePVCModal({
            kind,
            obj,
          }),
        accessReview: asAccessReview(kind, obj, 'create'),
      }),
    }),
    [t, kind, obj],
  );

  const actions = React.useMemo<Action[]>(() => {
    if (filterActions) {
      return filterActions.map((creator) => factory[creator]?.()).filter(Boolean);
    }
    return [factory.RestorePVC()];
  }, [factory, filterActions]);
  return actions;
};
