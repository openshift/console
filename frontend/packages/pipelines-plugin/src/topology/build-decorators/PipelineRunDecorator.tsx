import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { resourcePathFromModel, useAccessReview } from '@console/internal/components/utils';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import PipelineBuildDecoratorTooltip from '@console/pipelines-plugin/src/topology/build-decorators/PipelineBuildDecoratorTooltip';
import { getLatestPipelineRunStatus } from '@console/pipelines-plugin/src/utils/pipeline-utils';
import { Status } from '@console/shared';
import { BuildDecoratorBubble } from '@console/topology/src/components/graph-view';
import { startPipelineModal } from '../../components/pipelines/modals';
import { PipelineRunModel } from '../../models';
import { PipelineKind, PipelineRunKind } from '../../types';

type PipelineRunDecoratorProps = {
  pipeline: PipelineKind;
  pipelineRuns: PipelineRunKind[];
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
  const { t } = useTranslation();
  const { latestPipelineRun, status } = getLatestPipelineRunStatus(pipelineRuns);

  const statusIcon = <Status status={status} iconOnly noTooltip />;

  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace: pipeline.metadata.namespace,
    verb: 'create',
  };
  const canStartPipeline = useAccessReview(defaultAccessReview, impersonate);

  let ariaLabel;
  let tooltipContent;
  let decoratorContent;
  if (latestPipelineRun) {
    ariaLabel = t(`pipelines-plugin~Pipeline status is {{status}}. View logs.`, { status });
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
        <BuildDecoratorBubble x={x} y={y} radius={radius} ariaLabel={ariaLabel}>
          {statusIcon}
        </BuildDecoratorBubble>
      </Link>
    );
  } else {
    ariaLabel = t('pipelines-plugin~Pipeline not started. Start pipeline.');
    tooltipContent = t('pipelines-plugin~Pipeline not started');

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
      <BuildDecoratorBubble x={x} y={y} radius={radius} onClick={onClick} ariaLabel={ariaLabel}>
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
