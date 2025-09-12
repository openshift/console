import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { WorkloadPodsNode } from '@console/topology/src/components/graph-view';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';

const RevisionNode: React.FC<React.ComponentProps<typeof WorkloadPodsNode>> = (props) => {
  const { element } = props;
  const resource = getTopologyResourceObject(element.getData());
  const { loaded, loadError, pods } = usePodsForRevisions(
    resource.metadata?.uid ?? '',
    resource.metadata?.namespace ?? '',
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

  const { donutStatus: _, ...otherProps } = props;
  return (
    <WorkloadPodsNode donutStatus={donutStatus?.current ? donutStatus : null} {...otherProps} />
  );
};

export default observer(RevisionNode);
