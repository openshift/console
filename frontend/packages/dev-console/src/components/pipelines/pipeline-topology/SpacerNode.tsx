import * as React from 'react';
import { observer, Node } from '@console/topology';

const SpacerNode: React.FC<{ element: Node }> = () => {
  return <g />;
};

export default observer(SpacerNode);
