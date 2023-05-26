import * as React from 'react';
import { useTranslation } from 'react-i18next';
import HorizontalStackedBars from '../../components/charts/HorizontalStackedBars';
import { useTaskStatus } from '../../components/pipelineruns/hooks/useTaskStatus';
import TaskStatusToolTip from '../../components/pipelineruns/status/TaskStatusTooltip';
import { ComputedStatus, PipelineRunKind, TaskRunKind } from '../../types';
import { getRunStatusColor } from '../../utils/pipeline-augment';

import './PipelineBuildDecoratorTooltip.scss';

export interface PipelineBuildDecoratorTooltipProps {
  pipelineRun: PipelineRunKind;
  status: string;
  taskRuns: TaskRunKind[];
}

const PipelineBuildDecoratorTooltip: React.FC<PipelineBuildDecoratorTooltipProps> = ({
  pipelineRun,
  status,
  taskRuns,
}) => {
  const { t } = useTranslation();
  const taskStatus = useTaskStatus(pipelineRun, taskRuns);
  if (!pipelineRun || !status) {
    return null;
  }

  const pipelineBars = (
    <HorizontalStackedBars
      height="1em"
      inline
      values={Object.keys(ComputedStatus).map((rStatus) => ({
        color: getRunStatusColor(ComputedStatus[rStatus]).pftoken.value,
        name: rStatus,
        size: taskStatus[ComputedStatus[rStatus]],
      }))}
    />
  );
  const breakdownInfo = <TaskStatusToolTip taskStatus={taskStatus} />;

  return (
    <div className="odc-pipeline-build-decorator-tooltip">
      <div className="odc-pipeline-build-decorator-tooltip__title">
        {t('pipelines-plugin~Pipeline {{status}}', { status })}
      </div>
      <div className="odc-pipeline-build-decorator-tooltip__status-bars-wrapper">
        <div className="odc-pipeline-build-decorator-tooltip__status-bars-title">
          {t('pipelines-plugin~Task status')}
        </div>
        <div className="odc-pipeline-build-decorator-tooltip__status-bars">{pipelineBars}</div>
      </div>
      <div className="odc-pipeline-build-decorator-tooltip__status-breakdown">{breakdownInfo}</div>
    </div>
  );
};

export default PipelineBuildDecoratorTooltip;
