import type { FC } from 'react';
import type { Edge } from '@patternfly/react-topology';
import { EdgeTerminalType, observer } from '@patternfly/react-topology';
import { BaseEdge } from '@console/topology/src/components/graph-view';

type EventSinkLinkProps = {
  element: Edge;
};

const EventSinkLink: FC<EventSinkLinkProps> = ({ ...others }) => (
  <BaseEdge endTerminalType={EdgeTerminalType.circle} {...others} />
);

export default observer(EventSinkLink);
