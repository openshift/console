import * as React from 'react';
import { JobKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { JobActionFactory } from '../creators/job-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useJobActionsProvider = (resource: JobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = React.useMemo(
    () => [
      JobActionFactory.ModifyJobParallelism(kindObj, resource),
      ...pdbActions,
      ...commonActions,
    ],
    [kindObj, resource, pdbActions, commonActions],
  );

  return [actions, !inFlight, undefined];
};
