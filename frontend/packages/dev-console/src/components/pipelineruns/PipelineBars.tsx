import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import HorizontalStackedBars from '../charts/HorizontalStackedBars';
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
  const pipelineIdentifier =
    pipelinerun.metadata && pipelinerun.metadata.name ? pipelinerun.metadata.name : undefined;
  const data = pipeline && pipeline.data ? pipeline.data : undefined;
  const taskStatus = getTaskStatus(pipelinerun, data);

  // Tooltip key is necessary to disable the animations between two different Pipeline runs that
  // have different names. Typically this should be able to go on HorizontalStackedBars but there
  // is an issue with Tooltip and losing its mounted child node that breaks the popup.
  return (
    <Tooltip key={pipelineIdentifier} content={<TaskStatusToolTip taskStatus={taskStatus} />}>
      <HorizontalStackedBars
        // Note: disableAnimation is used here to prevent a no-key situation where React will try to
        // reuse elements and inadvertently cause animations BETWEEN different pipeline status'
        disableAnimation={!pipelineIdentifier}
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
