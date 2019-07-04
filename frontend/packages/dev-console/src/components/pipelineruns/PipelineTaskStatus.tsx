import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { PipelineRun, Pipeline } from '../../utils/pipeline-augment';
import { PipelineModel } from '../../models';
import { PipelineBars } from './PipelineBars';

export interface PipelineTaskStatusProps {
  pipelinerun: PipelineRun;
  pipeline?: Pipeline;
}

export const PipelineTaskStatus: React.FC<PipelineTaskStatusProps> = ({
  pipelinerun,
  pipeline,
}) => {
  return !pipeline &&
    pipelinerun &&
    pipelinerun.spec &&
    pipelinerun.spec.pipelineRef &&
    pipelinerun.spec.pipelineRef.name &&
    pipelinerun.metadata &&
    pipelinerun.metadata.namespace ? (
    <Firehose
      resources={[
        {
          name: pipelinerun.spec.pipelineRef.name,
          namespace: pipelinerun.metadata.namespace,
          kind: PipelineModel.kind,
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
