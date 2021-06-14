import * as React from 'react';
import { useAnchor, AnchorEnd, Node, observer } from '@patternfly/react-topology';
import { WorkloadPodsNode } from '@console/topology/src/components/graph-view';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import { useRoutesURL } from '../../../utils/useRoutesURL';
import RevisionTrafficTargetAnchor from '../anchors/RevisionTrafficTargetAnchor';

const DECORATOR_RADIUS = 13;
const RevisionNode: React.FC<React.ComponentProps<typeof WorkloadPodsNode>> = (props) => {
  const { element } = props;
  const resource = getTopologyResourceObject(element.getData());
  const url = useRoutesURL(resource);
  const hasDataUrl = !!url;

  useAnchor(
    React.useCallback(
      (node: Node) => new RevisionTrafficTargetAnchor(node, hasDataUrl ? DECORATOR_RADIUS : 0),
      [hasDataUrl],
    ),
    AnchorEnd.target,
    'revision-traffic',
  );
  const { loaded, loadError, pods } = usePodsForRevisions(
    resource.metadata.uid,
    resource.metadata.namespace,
  );
  const donutStatus = React.useMemo(() => {
    if (loaded && !loadError) {
      const [current, previous] = pods;
      const isRollingOut = !!current && !!previous;
      return {
        obj: resource,
        current,
        previous,
        isRollingOut,
        pods: [...(current?.pods || []), ...(previous?.pods || [])],
      };
    }
    return null;
  }, [loaded, loadError, pods, resource]);

  return <WorkloadPodsNode donutStatus={donutStatus} {...props} />;
};

export default observer(RevisionNode);
