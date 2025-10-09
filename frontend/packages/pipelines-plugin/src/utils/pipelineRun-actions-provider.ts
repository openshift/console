import { useMemo } from 'react';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const usePipelineRunActionsProvider = (pipelineRun) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(pipelineRun));
  const commonActions = useCommonResourceActions(kindObj, pipelineRun);
  const actions = useMemo(() => {
    return [...commonActions];
  }, [commonActions]);
  return [actions, !inFlight, undefined];
};
