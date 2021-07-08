import * as React from 'react';
import { k8sGet } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import { PipelineKind, PipelineRunKind } from '../../../types';
import { getPipelineFromPipelineRun } from '../../../utils/pipeline-augment';

export const usePipelineFromPipelineRun = (pipelineRun: PipelineRunKind): PipelineKind => {
  const [pipeline, setPipeline] = React.useState<PipelineKind>(null);
  React.useEffect(() => {
    const emptyPipeline: PipelineKind = { spec: { tasks: [] } };
    const pipelineFromPipelineRun = getPipelineFromPipelineRun(pipelineRun);
    if (pipelineFromPipelineRun) {
      setPipeline(pipelineFromPipelineRun);
    } else if (pipelineRun.spec.pipelineRef?.name) {
      const pipelineName = pipelineRun.spec.pipelineRef.name;
      k8sGet(PipelineModel, pipelineName, pipelineRun.metadata.namespace)
        .then((newPipeline: PipelineKind) => {
          setPipeline(newPipeline);
        })
        .catch(() => setPipeline(emptyPipeline));
    } else {
      setPipeline(emptyPipeline);
    }
  }, [pipelineRun]);
  return pipeline;
};
