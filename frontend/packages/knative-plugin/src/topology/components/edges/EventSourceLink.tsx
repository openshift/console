import * as React from 'react';
import {
  Edge,
  EdgeTerminalType,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
} from '@patternfly/react-topology';
import { BaseEdge } from '@console/topology/src/components/graph-view';

type EventSourceLinkProps = {
  element: Edge;
  dragging: boolean;
} & WithSourceDragProps &
  WithTargetDragProps;

const EventSourceLink: React.FC<EventSourceLinkProps> = ({ ...others }) => (
  <BaseEdge endTerminalType={EdgeTerminalType.circle} {...others} />
);

export default observer(EventSourceLink);
