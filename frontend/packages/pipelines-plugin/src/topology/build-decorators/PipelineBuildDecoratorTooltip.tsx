import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  getRunStatusColor,
  getTaskStatus,
  PipelineRun,
  runStatus,
} from '../../utils/pipeline-augment';
import HorizontalStackedBars from '../../components/charts/HorizontalStackedBars';
import TaskStatusToolTip from '../../components/pipelineruns/status/TaskStatusTooltip';
import './PipelineBuildDecoratorTooltip.scss';

export interface PipelineBuildDecoratorTooltipProps {
  pipelineRun: PipelineRun;
  status: string;
}

const PipelineBuildDecoratorTooltip: React.FC<PipelineBuildDecoratorTooltipProps> = ({
  pipelineRun,
  status,
}) => {
  const { t } = useTranslation();
  if (!pipelineRun || !status) {
    return null;
  }

  const taskStatus = getTaskStatus(pipelineRun);
  const pipelineBars = (
    <HorizontalStackedBars
      height="1em"
      inline
      values={Object.keys(runStatus).map((rStatus) => ({
        color: getRunStatusColor(runStatus[rStatus], t).pftoken.value,
        name: rStatus,
        size: taskStatus[runStatus[rStatus]],
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
          {t('pipelines-plugin~Task Status')}
        </div>
        <div className="odc-pipeline-build-decorator-tooltip__status-bars">{pipelineBars}</div>
      </div>
      <div className="odc-pipeline-build-decorator-tooltip__status-breakdown">{breakdownInfo}</div>
    </div>
  );
};

export default PipelineBuildDecoratorTooltip;
