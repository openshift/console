import * as React from 'react';
import { Status } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import { PipelineRunModel } from '@console/pipelines-plugin/src/models';
import { getLatestPipelineRunStatus } from '@console/pipelines-plugin/src/utils/pipeline-utils';
import PipelineBuildDecoratorTooltip from '@console/pipelines-plugin/src/topology/build-decorators/PipelineBuildDecoratorTooltip';
import { runStatus } from '@console/pipelines-plugin/src/utils/pipeline-augment';
import { WorkloadData } from '../../../topology-types';

type BuildDecoratorData = {
  decoratorIcon: React.ReactElement;
  linkRef?: string;
  tooltipContent: React.ReactElement;
};

export const getBuildDecoratorParts = (
  workloadData: WorkloadData,
  build: K8sResourceKind,
): BuildDecoratorData => {
  const { connectedPipeline } = workloadData;

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
