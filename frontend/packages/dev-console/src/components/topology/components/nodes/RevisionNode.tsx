import * as React from 'react';
import { useAnchor, AnchorEnd, Node, observer } from '@console/topology';
import RevisionTrafficTargetAnchor from '../anchors/RevisionTrafficTargetAnchor';
import WorkloadNode from './WorkloadNode';

const DECORATOR_RADIUS = 13;
const RevisionNode: React.FC<React.ComponentProps<typeof WorkloadNode>> = (props) => {
  const hasDataUrl = !!props.element.getData().data.url;
  useAnchor(
    React.useCallback(
      (node: Node) => new RevisionTrafficTargetAnchor(node, hasDataUrl ? DECORATOR_RADIUS : 0),
      [hasDataUrl],
    ),
    AnchorEnd.target,
    'revision-traffic',
  );
  return <WorkloadNode {...props} />;
};

export default observer(RevisionNode);
