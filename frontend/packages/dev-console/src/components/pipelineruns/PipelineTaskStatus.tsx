import * as React from 'react';
import { VictoryStack, VictoryBar } from 'victory';
import { Tooltip } from '@console/internal/components/utils/tooltip';
import {
  getTaskStatus,
  PipelineRun,
  runStatus,
  getRunStatusColor,
} from '../../utils/pipeline-augment';
import TaskStatusToolTip from './TaskStatusTooltip';

interface PipelineTaskStatusProps {
  pipelinerun: PipelineRun;
}

export const PipelineTaskStatus: React.FC<PipelineTaskStatusProps> = ({ pipelinerun }) => {
  const taskStatus = getTaskStatus(pipelinerun);
  return (
    <Tooltip content={<TaskStatusToolTip taskStatus={taskStatus} />}>
      <VictoryStack horizontal height={32}>
        {Object.keys(runStatus).map((status) => {
          return taskStatus[runStatus[status]] && taskStatus[runStatus[status]] > 0 ? (
            <VictoryBar
              key={status}
              barWidth={32}
              data={[{ x: 2, y: taskStatus[runStatus[status]] }]}
              style={{ data: { fill: getRunStatusColor(runStatus[status]).pftoken.value } }}
            />
          ) : null;
        })}
      </VictoryStack>
    </Tooltip>
  );
};
