import * as React from 'react';
import {
  getRunStatusColor,
  getTaskStatus,
  Pipeline,
  runStatus,
} from '../../../../../utils/pipeline-augment';
import HorizontalStackedBars from '../../../../charts/HorizontalStackedBars';
import TaskStatusToolTip from '../../../../pipelineruns/status/TaskStatusTooltip';
import './PipelineBuildDecoratorTooltip.scss';

export interface PipelineBuildDecoratorTooltipProps {
  pipeline: Pipeline;
  status: string;
}

const PipelineBuildDecoratorTooltip: React.FC<PipelineBuildDecoratorTooltipProps> = ({
  pipeline,
  status,
}) => {
  if (!pipeline || !status) {
    return null;
  }

  const taskStatus = getTaskStatus(pipeline.latestRun, pipeline);
  const pipelineBars = (
    <HorizontalStackedBars
      height="1em"
      inline
      values={Object.keys(runStatus).map((rStatus) => ({
        color: getRunStatusColor(runStatus[rStatus]).pftoken.value,
        name: rStatus,
        size: taskStatus[runStatus[rStatus]],
      }))}
    />
  );
  const breakdownInfo = <TaskStatusToolTip taskStatus={taskStatus} />;

  return (
    <div className="odc-pipeline-build-decorator-tooltip">
      <div className="odc-pipeline-build-decorator-tooltip__title">Pipeline {status}</div>
      <div className="odc-pipeline-build-decorator-tooltip__status-bars-wrapper">
        <div className="odc-pipeline-build-decorator-tooltip__status-bars-title">Task Status</div>
        <div className="odc-pipeline-build-decorator-tooltip__status-bars">{pipelineBars}</div>
      </div>
      <div className="odc-pipeline-build-decorator-tooltip__status-breakdown">{breakdownInfo}</div>
    </div>
  );
};

export default PipelineBuildDecoratorTooltip;
