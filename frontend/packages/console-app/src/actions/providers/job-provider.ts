import { useMemo } from 'react';
import type { JobKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { useJobActions } from '../hooks/useJobActions';
import { usePDBActions } from '../hooks/usePDBActions';

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
