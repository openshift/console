import * as React from 'react';
import { observer, Node, NodeModel } from '@patternfly/react-topology';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { PipelineVisualizationTask } from '../detail-page-tabs/pipeline-details/PipelineVisualizationTask';
import { TaskNodeModelData } from './types';

type TaskNodeProps = {
  element: Node<NodeModel, TaskNodeModelData>;
  disableTooltip?: boolean;
};

const TaskNode: React.FC<TaskNodeProps> = ({ element, disableTooltip }) => {
  const { height, width } = element.getBounds();
  const { pipeline, pipelineRun, task, selected } = element.getData();
  const isTaskSkipped = pipelineRun?.status?.skippedTasks?.some((t) => t.name === task.name);

  return (
    <PipelineVisualizationTask
      pipelineRunName={pipelineRun?.metadata?.name}
      task={task}
      pipelineRunStatus={pipelineRun && pipelineRunFilterReducer(pipelineRun)}
      namespace={pipeline?.metadata?.namespace}
      disableTooltip={disableTooltip}
      selected={selected}
      width={width}
      height={height}
      isSkipped={isTaskSkipped}
    />
  );
};

export default observer(TaskNode);
