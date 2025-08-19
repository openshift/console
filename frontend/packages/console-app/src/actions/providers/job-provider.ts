import { useMemo } from 'react';
import { JobKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePDBActions } from '../creators/pdb-factory';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { useJobActions } from '../hooks/useJobActions';

export const useJobActionsProvider = (resource: JobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const commonActions = useCommonResourceActions(kindObj, resource);
  const jobActions = useJobActions(resource);

  const actions = useMemo(() => [...jobActions, ...pdbActions, ...commonActions], [
    pdbActions,
    commonActions,
    jobActions,
  ]);

  return [actions, !inFlight, undefined];
};
