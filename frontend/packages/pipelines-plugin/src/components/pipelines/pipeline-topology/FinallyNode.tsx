import * as React from 'react';
import { observer, Node, NodeModel } from '@patternfly/react-topology';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { PipelineVisualizationTask } from '../detail-page-tabs/pipeline-details/PipelineVisualizationTask';
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  FINALLY_NODE_PADDING,
  FINALLY_NODE_VERTICAL_SPACING,
} from './const';
import { FinallyNodeModel } from './types';

type FinallyNodeProps = {
  element: Node<NodeModel, FinallyNodeModel>;
};

const FinallyNode: React.FC<FinallyNodeProps> = ({ element }) => {
  const { task, pipeline, pipelineRun } = element.getData();
  const { width, height } = element.getBounds();
  const { finallyTasks = [] } = task;
  return (
    <>
      <rect
        fill="transparent"
        strokeWidth={1}
        stroke="var(--pf-global--BorderColor--light-100)"
        width={width}
        height={height}
        rx="20"
        ry="20"
      />
      {finallyTasks.map((ft, i) => (
        <g
          key={ft.name}
          transform={`translate(${FINALLY_NODE_PADDING}, ${NODE_HEIGHT * i +
            FINALLY_NODE_VERTICAL_SPACING * i +
            FINALLY_NODE_PADDING})`}
        >
          <PipelineVisualizationTask
            pipelineRunName={pipelineRun?.metadata?.name}
            task={ft}
            pipelineRunStatus={pipelineRun && pipelineRunFilterReducer(pipelineRun)}
            namespace={pipeline?.metadata?.namespace}
            selected={ft.selected}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            isFinallyTask
            isSkipped={pipelineRun?.status?.skippedTasks?.some((t) => t.name === ft.name)}
          />
        </g>
      ))}
    </>
  );
};

export default observer(FinallyNode);
