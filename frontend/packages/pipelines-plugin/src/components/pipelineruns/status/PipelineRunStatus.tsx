import * as React from 'react';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { DASH } from '@console/shared';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import { PipelineRunModel } from '../../../models';
import PipelineResourceStatus from './PipelineResourceStatus';
import StatusPopoverContent from './StatusPopoverContent';

type PipelineRunStatusProps = {
  status: string;
  pipelineRun: PipelineRun;
};
const PipelineRunStatus: React.FC<PipelineRunStatusProps> = ({ status, pipelineRun }) => {
  return pipelineRun ? (
    <PipelineResourceStatus status={status}>
      <StatusPopoverContent
        logDetails={getPLRLogSnippet(pipelineRun)}
        namespace={pipelineRun.metadata.namespace}
        link={
          <Link
            to={`${resourcePathFromModel(
              PipelineRunModel,
              pipelineRun.metadata.name,
              pipelineRun.metadata.namespace,
            )}/logs`}
          >
            View Logs
          </Link>
        }
      />
    </PipelineResourceStatus>
  ) : (
    <>{DASH}</>
  );
};

export default PipelineRunStatus;
