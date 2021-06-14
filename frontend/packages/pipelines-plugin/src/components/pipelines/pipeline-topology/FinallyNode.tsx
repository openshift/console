import * as React from 'react';
import { observer, Node, NodeModel, Point } from '@patternfly/react-topology';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { PipelineVisualizationTask } from '../detail-page-tabs/pipeline-details/PipelineVisualizationTask';
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  FINALLY_NODE_PADDING,
  FINALLY_NODE_VERTICAL_SPACING,
  WHEN_EXPRESSION_SPACING,
} from './const';
import { integralShapePath, straightPath } from './draw-utils';
import { FinallyNodeModel } from './types';

import './FinallyNode.scss';

type FinallyNodeProps = {
  element: Node<NodeModel, FinallyNodeModel>;
};

const FinallyNode: React.FC<FinallyNodeProps> = ({ element }) => {
  const { task, pipeline, pipelineRun } = element.getData();
  const { width, height } = element.getBounds();
  const nodeCenter = NODE_HEIGHT + NODE_HEIGHT / 2;
  const leftPadding = FINALLY_NODE_PADDING + WHEN_EXPRESSION_SPACING;
  const verticalHeight = NODE_HEIGHT + FINALLY_NODE_VERTICAL_SPACING;

  const { finallyTasks = [] } = task;
  return (
    <g transform="translate(0.5, 0.5)" data-test="finally-node">
      <rect
        className="opp-finally-node"
        strokeWidth={1}
        width={width}
        height={height}
        rx="20"
        ry="20"
      />

      {finallyTasks.map((ft, i) => {
        return (
          <g data-test={`finally-task-node ${ft.name}`}>
            <path
              className="opp-finally-node__connector"
              d={
                nodeCenter + i * verticalHeight === height / 2
                  ? straightPath(new Point(leftPadding, height / 2), new Point(0, height / 2))
                  : integralShapePath(
                      new Point(0, height / 2),
                      new Point(leftPadding, nodeCenter + i * verticalHeight),
                    )
              }
            />
            <g
              key={ft.name}
              transform={`translate(${leftPadding}, ${NODE_HEIGHT * i +
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
          </g>
        );
      })}
    </g>
  );
};

export default observer(FinallyNode);
