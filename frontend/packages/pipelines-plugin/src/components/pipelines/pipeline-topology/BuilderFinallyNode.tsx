import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { chart_color_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { observer, Node, NodeModel } from '@patternfly/react-topology';
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
} from './const';
import PlusNodeDecorator from './PlusNodeDecorator';
import ErrorNodeDecorator from './ErrorNodeDecorator';
import { BuilderFinallyNodeModel } from './types';
import TaskList from './TaskList';

type BuilderFinallyNodeProps = {
  element: Node<NodeModel, BuilderFinallyNodeModel>;
};

const BuilderFinallyNode: React.FC<BuilderFinallyNodeProps> = ({ element }) => {
  const { t } = useTranslation();
  const { width, height } = element.getBounds();
  const { clusterTaskList = [], namespaceTaskList = [], task, namespace } = element.getData();
  const { addNewFinallyListNode, finallyTasks = [], finallyListTasks = [] } = task;
  const allTasksLength = finallyTasks.length + finallyListTasks.length;
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
          onClick={ft.onTaskSelection}
        >
          <PipelineVisualizationTask
            task={ft}
            namespace={namespace}
            disableTooltip
            selected={ft.selected}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
          />
          {ft.error && (
            <ErrorNodeDecorator
              x={BUILDER_NODE_ADD_RADIUS / 2}
              y={BUILDER_NODE_ERROR_RADIUS / 4}
              errorStr={ft.error}
            />
          )}
        </g>
      ))}
      {finallyListTasks.map((flt, i) => (
        <g
          key={flt.name}
          transform={`translate(${FINALLY_NODE_PADDING},
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
      ))}
      {
        <g
          transform={`translate(${FINALLY_NODE_PADDING +
            FINALLY_NODE_PADDING / 2}, ${allTasksLength * NODE_HEIGHT +
            allTasksLength * FINALLY_NODE_VERTICAL_SPACING +
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
            <text fill={blueColor.value} x={FINALLY_ADD_LINK_SIZE}>
              {t('pipelines-plugin~Add finally task')}
            </text>
          </g>
        </g>
      }
    </>
  );
};

export default observer(BuilderFinallyNode);
