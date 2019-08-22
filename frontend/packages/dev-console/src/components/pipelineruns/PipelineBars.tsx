import * as React from 'react';
import { VictoryStack, VictoryBar } from 'victory';
import { Tooltip } from '@patternfly/react-core';
import {
  getTaskStatus,
  runStatus,
  getRunStatusColor,
  Pipeline,
  PipelineRun,
} from '../../utils/pipeline-augment';
import TaskStatusToolTip from './TaskStatusTooltip';

export interface PipelineBarProps {
  pipelinerun: PipelineRun;
  pipeline?: { data: Pipeline };
}

export const PipelineBars: React.FC<PipelineBarProps> = ({ pipelinerun, pipeline }) => {
  const data = pipeline && pipeline.data ? pipeline.data : undefined;
  const taskStatus = getTaskStatus(pipelinerun, data);
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
