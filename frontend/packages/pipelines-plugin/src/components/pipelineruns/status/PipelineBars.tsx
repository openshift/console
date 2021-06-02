import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { PipelineRunKind } from '../../../types';
import { runStatus, getRunStatusColor } from '../../../utils/pipeline-augment';
import HorizontalStackedBars from '../../charts/HorizontalStackedBars';
import { useTaskStatus } from '../hooks/useTaskStatus';
import TaskStatusToolTip from './TaskStatusTooltip';

export interface PipelineBarProps {
  pipelinerun: PipelineRunKind;
}

export const PipelineBars: React.FC<PipelineBarProps> = ({ pipelinerun }) => {
  const taskStatus = useTaskStatus(pipelinerun);

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
