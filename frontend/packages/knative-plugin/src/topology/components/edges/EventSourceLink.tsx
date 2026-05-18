import type { FC } from 'react';
import type { Edge, WithSourceDragProps, WithTargetDragProps } from '@patternfly/react-topology';
import { EdgeTerminalType, observer } from '@patternfly/react-topology';
import { BaseEdge } from '@console/topology/src/components/graph-view/components/edges/BaseEdge';

type EventSourceLinkProps = {
  element: Edge;
  dragging: boolean;
} & WithSourceDragProps &
  WithTargetDragProps;

const EventSourceLink: FC<EventSourceLinkProps> = ({ ...others }) => (
  <BaseEdge endTerminalType={EdgeTerminalType.circle} {...others} />
);

export default observer(EventSourceLink);
