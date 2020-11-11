import * as React from 'react';
import { observer, Node } from '@patternfly/react-topology';

const SpacerNode: React.FC<{ element: Node }> = () => {
  return <g />;
};

export default observer(SpacerNode);
