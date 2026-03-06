import { useMemo } from 'react';
import type { CronJobKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { useCronJobActions } from '../hooks/useCronJobActions';
import { usePDBActions } from '../hooks/usePDBActions';

export const useCronJobActionsProvider = (resource: CronJobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const cronJobActions = useCronJobActions(resource);
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = useMemo(() => [...cronJobActions, ...pdbActions, ...commonActions], [
    cronJobActions,
    pdbActions,
    commonActions,
  ]);

  return [actions, !inFlight, undefined];
};
