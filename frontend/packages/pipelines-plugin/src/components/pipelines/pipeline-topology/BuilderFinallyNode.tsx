import * as React from 'react';
import { chart_color_blue_300 as blueColor } from '@patternfly/react-tokens';
import { observer, Node, NodeModel, Point } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { PipelineVisualizationTask } from '../detail-page-tabs/pipeline-details/PipelineVisualizationTask';
import {
  BUILDER_NODE_ADD_RADIUS,
  NODE_WIDTH,
  NODE_HEIGHT,
  FINALLY_NODE_PADDING,
  FINALLY_NODE_VERTICAL_SPACING,
  FINALLY_ADD_LINK_TEXT_HEIGHT,
  BUILDER_NODE_ERROR_RADIUS,
  FINALLY_ADD_LINK_SIZE,
  WHEN_EXPRESSION_SPACING,
} from './const';
import { integralShapePath, straightPath } from './draw-utils';
import ErrorNodeDecorator from './ErrorNodeDecorator';
import PlusNodeDecorator from './PlusNodeDecorator';
import TaskList from './TaskList';
import { BuilderFinallyNodeModel } from './types';

import './BuilderFinallyNode.scss';

type BuilderFinallyNodeProps = {
  element: Node<NodeModel, BuilderFinallyNodeModel>;
};

const BuilderFinallyNode: React.FC<BuilderFinallyNodeProps> = ({ element }) => {
  const { t } = useTranslation();
  const { width, height } = element.getBounds();
  const { clusterTaskList = [], namespaceTaskList = [], task, namespace } = element.getData();
  const { addNewFinallyListNode, finallyTasks = [], finallyListTasks = [] } = task;
  const allTasksLength = finallyTasks.length + finallyListTasks.length;
  const nodeCenter = NODE_HEIGHT + NODE_HEIGHT / 2;
  const leftPadding = FINALLY_NODE_PADDING + WHEN_EXPRESSION_SPACING;
  const verticalHeight = NODE_HEIGHT + FINALLY_NODE_VERTICAL_SPACING;
  const finallyTaskLinkX =
    FINALLY_NODE_PADDING +
    FINALLY_NODE_PADDING / 2 +
    (allTasksLength === 0 ? 0 : WHEN_EXPRESSION_SPACING);

  return (
    <g data-test="builder-finally-node">
      <rect className="opp-builder-finally-node" width={width} height={height} rx="20" ry="20" />

      {finallyTasks.map((ft, i) => (
        <g key={ft.name}>
          <path
            className="opp-builder-finally-node__task-connectors"
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
            data-test={`finally-task-node ${ft.name}`}
            transform={`translate(${leftPadding}, ${NODE_HEIGHT * i +
              FINALLY_NODE_VERTICAL_SPACING * i +
              FINALLY_NODE_PADDING})`}
            onClick={ft.onTaskSelection}
          >
            <PipelineVisualizationTask
              task={ft}
              namespace={namespace}
              disableTooltip
              selected={ft.selected}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              isFinallyTask
            />
            {ft.error && (
              <ErrorNodeDecorator
                x={BUILDER_NODE_ADD_RADIUS / 2}
                y={BUILDER_NODE_ERROR_RADIUS / 4}
                errorStr={ft.error}
              />
            )}
          </g>
        </g>
      ))}
      {finallyListTasks.map((flt, i) => (
        <g key={flt.name} data-test={`finally-task-list-node ${flt.name}`}>
          <path
            className="opp-builder-finally-node__task-connectors"
            d={
              nodeCenter + (i + finallyTasks.length) * verticalHeight === height / 2
                ? straightPath(new Point(leftPadding, height / 2), new Point(0, height / 2))
                : integralShapePath(
                    new Point(0, height / 2),
                    new Point(leftPadding, nodeCenter + (i + finallyTasks.length) * verticalHeight),
                  )
            }
          />
          <g
            transform={`translate(${leftPadding},
              ${NODE_HEIGHT * (i + finallyTasks.length) +
                FINALLY_NODE_VERTICAL_SPACING * (i + finallyTasks.length) +
                FINALLY_NODE_PADDING})`}
          >
            <TaskList
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              listOptions={[...clusterTaskList, ...namespaceTaskList]}
              onRemoveTask={flt.onRemoveTask}
              onNewTask={flt.convertList}
            />
          </g>
        </g>
      ))}
      {
        <g
          transform={`translate(${finallyTaskLinkX}, ${allTasksLength * NODE_HEIGHT +
            (allTasksLength - 1) * FINALLY_NODE_VERTICAL_SPACING +
            NODE_HEIGHT +
            FINALLY_ADD_LINK_TEXT_HEIGHT +
            FINALLY_NODE_PADDING})`}
          style={{ cursor: 'pointer' }}
          onClick={addNewFinallyListNode}
        >
          <g>
            <PlusNodeDecorator
              x={0}
              y={FINALLY_ADD_LINK_TEXT_HEIGHT - FINALLY_ADD_LINK_SIZE}
              tooltip={t('pipelines-plugin~Add finally task')}
            />
            <text fill={blueColor.value} x={FINALLY_ADD_LINK_SIZE} data-test="add-finally-node">
              {t('pipelines-plugin~Add finally task')}
            </text>
          </g>
        </g>
      }
    </g>
  );
};

export default observer(BuilderFinallyNode);
