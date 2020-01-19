import * as React from 'react';
import { observer, Node } from '@console/topology';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { PipelineVisualizationTask } from '../detail-page-tabs/pipeline-details/PipelineVisualizationTask';
import { DROP_SHADOW_SPACING } from './const';
import { TaskNodeModelData } from './types';

const TaskNode: React.FC<{ element: Node }> = ({ element }) => {
  const { height, width } = element.getBounds();
  const { pipeline, pipelineRun, task } = element.getData() as TaskNodeModelData;

  return (
    <foreignObject width={width} height={height + DROP_SHADOW_SPACING}>
      <PipelineVisualizationTask
        pipelineRunName={pipelineRun?.metadata?.name}
        task={task}
        pipelineRunStatus={pipelineRun && pipelineRunFilterReducer(pipelineRun)}
        namespace={pipeline?.metadata?.namespace}
      />
    </foreignObject>
  );
};

export default observer(TaskNode);
