import * as React from 'react';
import { Status } from '@console/shared';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import { PipelineRunModel } from '../../../../../models';
import { constructCurrentPipeline } from '../../../../../utils/pipeline-utils';
import { WorkloadData } from '../../../../topology/topology-types';
import PipelineBuildDecoratorTooltip from './PipelineBuildDecoratorTooltip';

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

  let currentPipelineStatus = null;
  if (connectedPipeline) {
    const { pipelineRuns, pipeline } = connectedPipeline;
    currentPipelineStatus = constructCurrentPipeline(pipeline, pipelineRuns);
  }

  if (currentPipelineStatus) {
    const { currentPipeline, status } = currentPipelineStatus;
    tooltipContent = <PipelineBuildDecoratorTooltip pipeline={currentPipeline} status={status} />;
    decoratorIcon = <Status status={status} iconOnly noTooltip />;
    linkRef = `${resourcePathFromModel(
      PipelineRunModel,
      currentPipeline.latestRun.metadata.name,
      currentPipeline.latestRun.metadata.namespace,
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
