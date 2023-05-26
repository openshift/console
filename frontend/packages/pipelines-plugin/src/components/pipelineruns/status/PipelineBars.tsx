import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ComputedStatus, PipelineRunKind, TaskRunKind } from '../../../types';
import { getRunStatusColor } from '../../../utils/pipeline-augment';
import HorizontalStackedBars from '../../charts/HorizontalStackedBars';
import { useTaskStatus } from '../hooks/useTaskStatus';
import TaskStatusToolTip from './TaskStatusTooltip';

export interface PipelineBarProps {
  pipelinerun: PipelineRunKind;
  taskRuns: TaskRunKind[];
}

export const PipelineBars: React.FC<PipelineBarProps> = ({ pipelinerun, taskRuns }) => {
  const taskStatus = useTaskStatus(pipelinerun, taskRuns);
  return (
    <Tooltip content={<TaskStatusToolTip taskStatus={taskStatus} />}>
      <HorizontalStackedBars
        height="1em"
        inline
        values={Object.keys(ComputedStatus).map((status) => ({
          color: getRunStatusColor(ComputedStatus[status]).pftoken.value,
          name: status,
          size: taskStatus[ComputedStatus[status]],
        }))}
      />
    </Tooltip>
  );
};
