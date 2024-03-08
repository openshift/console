import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { LoadingInline, resourcePathFromModel } from '@console/internal/components/utils';
import { DASH } from '@console/shared';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind, TaskRunKind } from '../../../types';
import { PipelineBars } from './PipelineBars';

export interface LinkedPipelineRunTaskStatusProps {
  pipelineRun: PipelineRunKind;
  taskRuns: TaskRunKind[];
  taskRunsLoaded?: boolean;
}

/**
 * Will attempt to render a link to the log file associated with the pipelineRun if it has the data.
 * If it does not, it'll just render the pipeline status.
 */
const LinkedPipelineRunTaskStatus: React.FC<LinkedPipelineRunTaskStatusProps> = ({
  pipelineRun,
  taskRuns,
  taskRunsLoaded,
}) => {
  const { t } = useTranslation();
  const pipelineStatus =
    taskRuns.length > 0 ? (
      <PipelineBars
        key={pipelineRun.metadata?.name}
        pipelinerun={pipelineRun}
        taskRuns={taskRuns}
      />
    ) : taskRunsLoaded && taskRuns.length === 0 ? (
      <>{DASH}</>
    ) : (
      <LoadingInline />
    );

  if (pipelineRun.metadata?.name && pipelineRun.metadata?.namespace) {
    return (
      <Link
        to={`${resourcePathFromModel(
          PipelineRunModel,
          pipelineRun.metadata.name,
          pipelineRun.metadata.namespace,
        )}/logs`}
        role="button"
        aria-label={t('pipelines-plugin~View logs')}
      >
        {pipelineStatus}
      </Link>
    );
  }

  return pipelineStatus;
};

export default LinkedPipelineRunTaskStatus;
