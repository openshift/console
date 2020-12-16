import * as React from 'react';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { Pipeline, PipelineRun } from '../../../utils/pipeline-augment';
import { PipelineRunModel } from '../../../models';
import { PipelineTaskStatus } from './PipelineTaskStatus';

export interface LinkedPipelineRunTaskStatusProps {
  pipeline?: Pipeline;
  pipelineRun: PipelineRun;
}

/**
 * Will attempt to render a link to the log file associated with the pipelineRun if it has the data.
 * If it does not, it'll just render the pipeline status.
 */
const LinkedPipelineRunTaskStatus: React.FC<LinkedPipelineRunTaskStatusProps> = ({
  pipeline,
  pipelineRun,
}) => {
  const pipelineStatus = (
    <PipelineTaskStatus
      key={pipelineRun.metadata?.name}
      pipeline={pipeline}
      pipelinerun={pipelineRun}
    />
  );

  if (pipelineRun.metadata?.name && pipelineRun.metadata?.namespace) {
    return (
      <Link
        to={`${resourcePathFromModel(
          PipelineRunModel,
          pipelineRun.metadata.name,
          pipelineRun.metadata.namespace,
        )}/logs`}
      >
        {pipelineStatus}
      </Link>
    );
  }

  return pipelineStatus;
};

export default LinkedPipelineRunTaskStatus;
