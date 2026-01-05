import type { FC } from 'react';
import { Edge, observer, ScaleDetailsLevel } from '@patternfly/react-topology';
import { BaseEdge } from '@console/topology/src/components/graph-view';

type TrafficLinkProps = {
  element: Edge;
};

const TrafficLink: FC<TrafficLinkProps> = ({ element }) => {
  const detailsLevel = element.getGraph().getDetailsLevel();
  const { percent } = element.getData();
  return (
    <BaseEdge
      element={element}
      className="odc-traffic-link"
      tag={detailsLevel === ScaleDetailsLevel.high && `${percent}%`}
    />
  );
};

export default observer(TrafficLink);
