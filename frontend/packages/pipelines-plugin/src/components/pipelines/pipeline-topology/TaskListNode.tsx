import * as React from 'react';
import { observer, Node, NodeModel } from '@patternfly/react-topology';
import { TaskListNodeModelData } from './types';
import TaskList from './TaskList';

import './TaskListNode.scss';

type TaskListNodeProps = {
  element: Node<NodeModel, TaskListNodeModelData>;
  unselectedText?: string;
};

const TaskListNode: React.FC<TaskListNodeProps> = ({ element, unselectedText }) => {
  const { height = 30, width = 120 } = {};
  const {
    clusterTaskList = [],
    namespaceTaskList = [],
    onNewTask = () => {},
    onRemoveTask = () => {},
  } = element.getData() || {};

  return (
    <TaskList
      width={width}
      height={height}
      listOptions={[...clusterTaskList, ...namespaceTaskList]}
      unselectedText={unselectedText}
      onRemoveTask={onRemoveTask}
      onNewTask={onNewTask}
    />
  );
};

export default observer(TaskListNode);
