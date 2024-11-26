import * as React from 'react';
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
  BUILDER_NODE_DECORATOR_RADIUS,
  FINALLY_ADD_LINK_SIZE,
  WHEN_EXPRESSION_SPACING,
} from './const';
import { integralShapePath, straightPath } from './draw-utils';
import ErrorNodeDecorator from './ErrorNodeDecorator';
import LoadingTask from './LoadingTask';
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

  const {
    addNewFinallyListNode,
    finallyTasks = [],
    finallyListTasks = [],
    finallyLoadingTasks = [],
    finallyInvalidListTasks = [],
    onTaskSearch = () => {},
  } = task;
  const allTasksLength =
    finallyTasks.length +
    finallyListTasks.length +
    finallyLoadingTasks.length +
    finallyInvalidListTasks.length;
  const nodeCenter = NODE_HEIGHT + NODE_HEIGHT / 2;
  const leftPadding = FINALLY_NODE_PADDING + WHEN_EXPRESSION_SPACING;
  const verticalHeight = NODE_HEIGHT + FINALLY_NODE_VERTICAL_SPACING;
  const finallyTaskLinkX =
    FINALLY_NODE_PADDING +
    FINALLY_NODE_PADDING / 2 +
    (allTasksLength === 0 ? 0 : WHEN_EXPRESSION_SPACING);

  const IntegralShape = ({ taskIndex }: { taskIndex: number }) => (
    <path
      className="opp-builder-finally-node__task-connectors"
      d={
        nodeCenter + taskIndex * verticalHeight === height / 2
          ? straightPath(new Point(leftPadding, height / 2), new Point(0, height / 2))
          : integralShapePath(
              new Point(0, height / 2),
              new Point(leftPadding, nodeCenter + taskIndex * verticalHeight),
            )
      }
    />
  );

  return (
    <g data-test="builder-finally-node">
      <rect className="opp-builder-finally-node" width={width} height={height} rx="20" ry="20" />

      {finallyTasks.map((ft, i) => (
        <g key={ft.name}>
          <IntegralShape taskIndex={i} />
          <g
            data-test={`finally-task-node ${ft.name}`}
            transform={`translate(${leftPadding}, ${
              NODE_HEIGHT * i + FINALLY_NODE_VERTICAL_SPACING * i + FINALLY_NODE_PADDING
            })`}
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
                y={BUILDER_NODE_DECORATOR_RADIUS / 4}
                errorStr={ft.error}
              />
            )}
          </g>
        </g>
      ))}
      {finallyLoadingTasks.map((fld, i) => (
        <g key={fld.name} data-test={`finally-loading-task-list-node ${fld.name}`}>
          <IntegralShape taskIndex={i + finallyTasks.length} />
          <g
            transform={`translate(${leftPadding},
          ${
            NODE_HEIGHT * (i + finallyTasks.length) +
            FINALLY_NODE_VERTICAL_SPACING * (i + finallyTasks.length) +
            FINALLY_NODE_PADDING
          })`}
          >
            <LoadingTask width={NODE_WIDTH} height={NODE_HEIGHT} name={fld.name} key={fld.name} />
          </g>
        </g>
      ))}
      {finallyInvalidListTasks.map((ivl, i) => (
        <g key={ivl.name} data-test={`finally-invalid-task-list-node ${ivl.name}`}>
          <IntegralShape taskIndex={i + finallyTasks.length + finallyLoadingTasks.length} />
          <g
            transform={`translate(${leftPadding},
              ${
                NODE_HEIGHT * (i + finallyTasks.length + finallyLoadingTasks.length) +
                FINALLY_NODE_VERTICAL_SPACING *
                  (i + finallyTasks.length + finallyLoadingTasks.length) +
                FINALLY_NODE_PADDING
              })`}
          >
            <TaskList
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              listOptions={[...clusterTaskList, ...namespaceTaskList]}
              onRemoveTask={ivl.onRemoveTask}
              onNewTask={ivl.convertList}
              onTaskSearch={onTaskSearch}
              unselectedText={ivl.name}
            />
            <ErrorNodeDecorator
              x={BUILDER_NODE_DECORATOR_RADIUS / 2}
              y={BUILDER_NODE_DECORATOR_RADIUS / 4}
              errorStr={t('pipelines-plugin~Task does not exist')}
            />
          </g>
        </g>
      ))}

      {finallyListTasks.map((flt, i) => (
        <g key={flt.name} data-test={`finally-task-list-node ${flt.name}`}>
          <IntegralShape
            taskIndex={
              i + finallyTasks.length + finallyLoadingTasks.length + finallyInvalidListTasks.length
            }
          />
          <g
            transform={`translate(${leftPadding},
              ${
                NODE_HEIGHT *
                  (i +
                    finallyTasks.length +
                    finallyLoadingTasks.length +
                    finallyInvalidListTasks.length) +
                FINALLY_NODE_VERTICAL_SPACING *
                  (i +
                    finallyTasks.length +
                    finallyLoadingTasks.length +
                    finallyInvalidListTasks.length) +
                FINALLY_NODE_PADDING
              })`}
          >
            <TaskList
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              listOptions={[...clusterTaskList, ...namespaceTaskList]}
              onRemoveTask={flt.onRemoveTask}
              onNewTask={flt.convertList}
              onTaskSearch={onTaskSearch}
            />
          </g>
        </g>
      ))}
      {
        <g
          transform={`translate(${finallyTaskLinkX}, ${
            allTasksLength * NODE_HEIGHT +
            (allTasksLength - 1) * FINALLY_NODE_VERTICAL_SPACING +
            NODE_HEIGHT +
            FINALLY_ADD_LINK_TEXT_HEIGHT +
            FINALLY_NODE_PADDING
          })`}
          style={{ cursor: 'pointer' }}
          onClick={addNewFinallyListNode}
        >
          <g>
            <PlusNodeDecorator
              x={0}
              y={FINALLY_ADD_LINK_TEXT_HEIGHT - FINALLY_ADD_LINK_SIZE}
              tooltip={t('pipelines-plugin~Add finally task')}
            />
            <text
              x={FINALLY_ADD_LINK_SIZE}
              data-test="add-finally-node"
              className="opp-builder-finally-node__text"
            >
              {t('pipelines-plugin~Add finally task')}
            </text>
          </g>
        </g>
      }
    </g>
  );
};

export default observer(BuilderFinallyNode);
