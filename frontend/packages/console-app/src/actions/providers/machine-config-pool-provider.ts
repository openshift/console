import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { asAccessReview, togglePaused } from '@console/internal/components/utils';
import { MachineConfigPoolModel } from '@console/internal/models';
import type { MachineConfigPoolKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

const usePauseAction = (obj: MachineConfigPoolKind): Action[] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();

  const factory = useMemo(
    () => ({
      PauseUpdates: () => ({
        id: 'pause-updates',
        label: obj.spec?.paused ? t('public~Resume updates') : t('public~Pause updates'),
        cta: () =>
          togglePaused(MachineConfigPoolModel, obj).catch((err) =>
            launchModal(ErrorModal, { error: err.message }),
          ),
        accessReview: asAccessReview(MachineConfigPoolModel, obj, 'patch'),
      }),
    }),
    [launchModal, obj, t],
  );

  const action = useMemo<Action[]>(() => [factory.PauseUpdates()], [factory]);
  return action;
};

export const useMachineConfigPoolActionsProvider = (
  resource: MachineConfigPoolKind,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const pauseAction = usePauseAction(resource);
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = useMemo<Action[]>(() => [...pauseAction, ...commonActions], [
    pauseAction,
    commonActions,
  ]);
  return [actions, !inFlight, false];
};
