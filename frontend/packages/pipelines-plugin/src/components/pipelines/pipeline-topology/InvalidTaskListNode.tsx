import * as React from 'react';
import { Node, NodeModel, observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { BUILDER_NODE_ERROR_RADIUS } from './const';
import ErrorNodeDecorator from './ErrorNodeDecorator';
import TaskListNode from './TaskListNode';
import { TaskListNodeModelData } from './types';

type InvalidTaskListNodeProps = {
  element: Node<NodeModel, TaskListNodeModelData>;
};

const InvalidTaskListNode: React.FC<InvalidTaskListNodeProps> = ({ element }) => {
  const { t } = useTranslation();
  const {
    task: { name },
  } = element.getData();

  return (
    <g>
      <TaskListNode element={element} unselectedText={name} />
      <ErrorNodeDecorator
        x={BUILDER_NODE_ERROR_RADIUS / 2}
        y={BUILDER_NODE_ERROR_RADIUS / 4}
        errorStr={t('pipelines-plugin~Task does not exist')}
      />
    </g>
  );
};

export default observer(InvalidTaskListNode);
