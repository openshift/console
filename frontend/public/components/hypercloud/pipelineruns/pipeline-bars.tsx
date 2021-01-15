import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import HorizontalStackedBars from '../utils/horizontal-stacked-bars';
import {
  getTaskStatus,
  runStatus,
  getRunStatusColor,
  Pipeline,
  PipelineRun,
} from '../utils/pipeline-augment';
import TaskStatusToolTip from './task-status-tooltip';

export interface PipelineBarProps {
  pipelinerun: PipelineRun;
  pipeline?: { data: Pipeline };
}

export const PipelineBars: React.FC<PipelineBarProps> = ({ pipelinerun, pipeline }) => {
  const taskStatus = getTaskStatus(pipelinerun, pipeline?.data);

  return (
    <Tooltip content={<TaskStatusToolTip taskStatus={taskStatus} />}>
      <HorizontalStackedBars
        height="1em"
        inline
        values={Object.keys(runStatus).map((status) => ({
          color: getRunStatusColor(runStatus[status]).pftoken.value,
          name: status,
          size: taskStatus[runStatus[status]],
        }))}
      />
    </Tooltip>
  );
};
