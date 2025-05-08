import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { CronJobKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';
import { CronJobActionFactory } from '../creators/cronjob-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useCronJobActionsProvider = (resource: CronJobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const navigate = useNavigate();

  const actions = React.useMemo(
    () => [
      CronJobActionFactory.StartJob(kindObj, resource, { navigate }),
      ...pdbActions,
      ...getCommonResourceActions(kindObj, resource),
    ],
    [kindObj, pdbActions, resource, navigate],
  );

  return [actions, !inFlight, undefined];
};
