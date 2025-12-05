import { useMemo } from 'react';
import { usePVCActions } from '@console/app/src/actions/hooks/usePVCActions';
import { Action } from '@console/dynamic-plugin-sdk';
import { referenceFor, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionCreator, PVCActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

export const usePVCActionsProvider = (
  resource: PersistentVolumeClaimKind,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const isVACSupported = useFlag(FLAGS.VAC_PLATFORM_SUPPORT);

  const pvcActionsList = useMemo(() => {
    const baseActions = [
      PVCActionCreator.ExpandPVC,
      PVCActionCreator.PVCSnapshot,
      PVCActionCreator.ClonePVC,
    ];

    // Conditionally check platform support for VAC
    return isVACSupported ? [...baseActions, PVCActionCreator.ModifyVAC] : baseActions;
  }, [isVACSupported]);

  const pvcActions = usePVCActions(resource, pvcActionsList);
  const pvcDeleteAction = usePVCActions(resource, [PVCActionCreator.DeletePVC]);
  const [commonActions] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.Edit,
  ]);

  const actions = useMemo(
    () => [...pvcActions, ...Object.values(commonActions), ...pvcDeleteAction],
    [pvcActions, commonActions, pvcDeleteAction],
  );
  return [actions, !inFlight, false];
};
