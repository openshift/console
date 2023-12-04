import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import { impersonateStateToProps } from '@console/dynamic-plugin-sdk';
import { resourcePathFromModel, useAccessReview } from '@console/internal/components/utils';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import PipelineBuildDecoratorTooltip from '@console/pipelines-plugin/src/topology/build-decorators/PipelineBuildDecoratorTooltip';
import { getLatestPipelineRunStatus } from '@console/pipelines-plugin/src/utils/pipeline-utils';
import { Status } from '@console/shared';
import { BuildDecoratorBubble } from '@console/topology/src/components/graph-view';
import { startPipelineModal } from '../../components/pipelines/modals';
import { getTaskRunsOfPipelineRun, useTaskRuns } from '../../components/taskruns/useTaskRuns';
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
  const ref = React.useRef();
  const { t } = useTranslation();
  const { latestPipelineRun, status } = getLatestPipelineRunStatus(pipelineRuns);
  const [taskRuns, taskRunsLoaded] = useTaskRuns(latestPipelineRun?.metadata?.namespace);
  const PLRTaskRuns = getTaskRunsOfPipelineRun(taskRuns, latestPipelineRun?.metadata?.namespace);
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
    tooltipContent = taskRunsLoaded && (
      <PipelineBuildDecoratorTooltip
        pipelineRun={latestPipelineRun}
        status={status}
        taskRuns={PLRTaskRuns}
      />
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
    <Tooltip triggerRef={ref} content={tooltipContent} position={TooltipPosition.left}>
      <g ref={ref}>{decoratorContent}</g>
    </Tooltip>
  );
};

export default connect(impersonateStateToProps)(ConnectedPipelineRunDecorator);
