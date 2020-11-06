import * as React from 'react';
import { Status } from '@console/shared';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import { PipelineRunModel } from '../../../../../models';
import { getLatestPipelineRunStatus } from '../../../../../utils/pipeline-utils';
import { WorkloadData } from '../../../topology-types';
import PipelineBuildDecoratorTooltip from './PipelineBuildDecoratorTooltip';
import { runStatus } from '../../../../../utils/pipeline-augment';

type BuildDecoratorData = {
  decoratorIcon: React.ReactElement;
  linkRef?: string;
  tooltipContent: React.ReactElement;
};

export const getBuildDecoratorParts = (workloadData: WorkloadData): BuildDecoratorData => {
  const { build, connectedPipeline } = workloadData;

  let tooltipContent = null;
  let decoratorIcon = null;
  let linkRef = null;

  let latestPipelineRunStatus = null;
  if (connectedPipeline) {
    const { pipelineRuns } = connectedPipeline;
    latestPipelineRunStatus = getLatestPipelineRunStatus(pipelineRuns);
  }

  if (latestPipelineRunStatus) {
    const { latestPipelineRun, status } = latestPipelineRunStatus;
    if (status === runStatus.PipelineNotStarted) {
      tooltipContent = 'Pipeline not started';
    } else {
      tooltipContent = (
        <PipelineBuildDecoratorTooltip pipelineRun={latestPipelineRun} status={status} />
      );
    }

    decoratorIcon = <Status status={status} iconOnly noTooltip />;
    linkRef = `${resourcePathFromModel(
      PipelineRunModel,
      latestPipelineRun.metadata.name,
      latestPipelineRun.metadata.namespace,
    )}/logs`;
  } else if (build) {
    tooltipContent = `Build ${build.status && build.status.phase}`;
    decoratorIcon = <Status status={build.status.phase} iconOnly noTooltip />;
    linkRef = `${resourcePathFromModel(
      BuildModel,
      build.metadata.name,
      build.metadata.namespace,
    )}/logs`;
  }

  return {
    tooltipContent,
    decoratorIcon,
    linkRef,
  };
};
