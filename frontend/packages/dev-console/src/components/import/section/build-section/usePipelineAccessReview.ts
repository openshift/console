import { useAccessReview } from '@console/internal/components/utils';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { CLUSTER_PIPELINE_NS } from '../../../../const';
import { PipelineModel } from '../../../../models/pipelines';

export const usePipelineAccessReview = (): boolean => {
  const [activeNamespace] = useActiveNamespace();
  const canListPipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: CLUSTER_PIPELINE_NS,
    verb: 'list',
  });

  const canCreatePipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: activeNamespace,
    verb: 'create',
  });

  return canListPipelines && canCreatePipelines;
};
