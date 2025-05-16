import * as React from 'react';
import { CronJobKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../creators/common-factory';
import { CronJobActionFactory } from '../creators/cronjob-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useCronJobActionsProvider = (resource: CronJobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = React.useMemo(
    () => [CronJobActionFactory.StartJob(kindObj, resource), ...pdbActions, ...commonActions],
    [kindObj, pdbActions, resource, commonActions],
  );

  return [actions, !inFlight, undefined];
};
