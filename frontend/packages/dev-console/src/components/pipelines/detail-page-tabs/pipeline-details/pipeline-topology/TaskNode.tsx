import * as React from 'react';
import { observer, Node } from '@console/topology';
import { PipelineVisualizationTask } from '../PipelineVisualizationTask';
import { pipelineRunFilterReducer } from '../../../../../utils/pipeline-filter-reducer';

const TaskNode: React.FC<{ element: Node }> = ({ element }) => {
  const { height, width } = element.getBounds();
  const { pipeline, pipelineRun, task } = element.getData();

  return (
    <foreignObject width={width} height={height}>
      <PipelineVisualizationTask
        pipelineRun={pipelineRun}
        task={task}
        pipelineRunStatus={pipelineRun && pipelineRunFilterReducer(pipelineRun)}
        namespace={pipeline.metadata.namespace}
      />
    </foreignObject>
  );
};

export default observer(TaskNode);
