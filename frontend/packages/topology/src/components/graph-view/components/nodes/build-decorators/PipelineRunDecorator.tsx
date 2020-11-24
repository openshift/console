import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Pipeline, PipelineRun } from '@console/pipelines-plugin/src/utils/pipeline-augment';
import { getLatestPipelineRunStatus } from '@console/pipelines-plugin/src/utils/pipeline-utils';
import PipelineBuildDecoratorTooltip from '@console/pipelines-plugin/src/topology/build-decorators/PipelineBuildDecoratorTooltip';
import { Status } from '@console/shared/src';
import { resourcePathFromModel, useAccessReview } from '@console/internal/components/utils';
import { PipelineRunModel } from '@console/pipelines-plugin/src/models';
import BuildDecoratorBubble from './BuildDecoratorBubble';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { startPipelineModal } from '@console/pipelines-plugin/src/components/pipelines/modals';

type PipelineRunDecoratorProps = {
  pipeline: Pipeline;
  pipelineRuns: PipelineRun[];
  radius: number;
  x: number;
  y: number;
};

type StateProps = {
  impersonate?: {
    kind: string;
    name: string;
    subprotocols: string[];
  };
};

export const ConnectedPipelineRunDecorator: React.FC<PipelineRunDecoratorProps & StateProps> = ({
  pipeline,
  pipelineRuns,
  radius,
  x,
  y,
  impersonate,
}) => {
  const { latestPipelineRun, status } = getLatestPipelineRunStatus(pipelineRuns);

  const statusIcon = <Status status={status} iconOnly noTooltip />;

  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace: pipeline.metadata.namespace,
    verb: 'create',
  };
  const canStartPipeline = useAccessReview(defaultAccessReview, impersonate);

  let tooltipContent;
  let decoratorContent;
  if (latestPipelineRun) {
    tooltipContent = (
      <PipelineBuildDecoratorTooltip pipelineRun={latestPipelineRun} status={status} />
    );
    const link = `${resourcePathFromModel(
      PipelineRunModel,
      latestPipelineRun.metadata.name,
      latestPipelineRun.metadata.namespace,
    )}/logs`;
    decoratorContent = (
      <Link to={link}>
        <BuildDecoratorBubble x={x} y={y} radius={radius}>
          {statusIcon}
        </BuildDecoratorBubble>
      </Link>
    );
  } else {
    tooltipContent = 'Pipeline not started';

    let onClick = null;
    if (canStartPipeline) {
      onClick = () => {
        startPipelineModal({
          pipeline,
          modalClassName: 'modal-lg',
        });
      };
    }

    decoratorContent = (
      <BuildDecoratorBubble x={x} y={y} radius={radius} onClick={onClick}>
        {statusIcon}
      </BuildDecoratorBubble>
    );
  }

  return (
    <Tooltip content={tooltipContent} position={TooltipPosition.left}>
      {decoratorContent}
    </Tooltip>
  );
};

export default connect(impersonateStateToProps)(ConnectedPipelineRunDecorator);
