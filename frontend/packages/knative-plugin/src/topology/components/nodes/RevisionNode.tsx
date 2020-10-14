import * as React from 'react';
import { useAnchor, AnchorEnd, Node, observer } from '@patternfly/react-topology';
import {
  getTopologyResourceObject,
  WorkloadPodsNode,
} from '@console/dev-console/src/components/topology';
import RevisionTrafficTargetAnchor from '../anchors/RevisionTrafficTargetAnchor';
import { PodRCData } from '@console/shared/src';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';

const DECORATOR_RADIUS = 13;
const RevisionNode: React.FC<React.ComponentProps<typeof WorkloadPodsNode>> = (props) => {
  const { element } = props;
  const resource = getTopologyResourceObject(element.getData());
  const [donutStatus, setDonutStatus] = React.useState<PodRCData>();
  const hasDataUrl = !!element.getData().data.url;
  useAnchor(
    React.useCallback(
      (node: Node) => new RevisionTrafficTargetAnchor(node, hasDataUrl ? DECORATOR_RADIUS : 0),
      [hasDataUrl],
    ),
    AnchorEnd.target,
    'revision-traffic',
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const revisions = React.useMemo(() => [resource], [resource.metadata.uid]);
  const { loaded, pods } = usePodsForRevisions(revisions, resource.metadata.namespace);
  React.useEffect(() => {
    if (loaded) {
      const [current, previous] = pods;
      const isRollingOut = !!current && !!previous;
      setDonutStatus({
        obj: resource,
        current,
        previous,
        isRollingOut,
        pods: [...(current?.pods || []), ...(previous?.pods || [])],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, pods]);

  return <WorkloadPodsNode donutStatus={donutStatus} {...props} />;
};

export default observer(RevisionNode);
