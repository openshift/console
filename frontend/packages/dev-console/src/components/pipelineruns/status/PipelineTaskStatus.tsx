import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRun, Pipeline } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import { PipelineBars } from './PipelineBars';

export interface PipelineTaskStatusProps {
  pipelinerun: PipelineRun;
  pipeline?: Pipeline;
}

export const PipelineTaskStatus: React.FC<PipelineTaskStatusProps> = ({
  pipelinerun,
  pipeline,
}) => {
  return !pipeline && pipelinerun.spec?.pipelineRef?.name && pipelinerun.metadata?.namespace ? (
    <Firehose
      resources={[
        {
          name: pipelinerun.spec.pipelineRef.name,
          namespace: pipelinerun.metadata.namespace,
          kind: referenceForModel(PipelineModel),
          isList: false,
          prop: 'pipeline',
        },
      ]}
    >
      <PipelineBars pipelinerun={pipelinerun} />
    </Firehose>
  ) : (
    <PipelineBars pipelinerun={pipelinerun} pipeline={{ data: pipeline }} />
  );
};
