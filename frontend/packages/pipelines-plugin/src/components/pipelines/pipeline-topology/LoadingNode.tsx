import * as React from 'react';
import { observer, Node } from '@patternfly/react-topology';
import LoadingTask from './LoadingTask';

const LoadingNode: React.FC<{ element: Node }> = ({ element }) => {
  const { height, width } = element.getBounds();
  const {
    task: { name },
  } = element.getData();

  return <LoadingTask {...{ width, height, name }} />;
};

export default observer(LoadingNode);
