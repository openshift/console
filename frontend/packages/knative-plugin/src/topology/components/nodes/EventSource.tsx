import * as React from 'react';
import { SignOutAltIcon } from '@patternfly/react-icons';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  WithDragNodeProps,
  WithCreateConnectorProps,
  Edge,
} from '@patternfly/react-topology';
import { BaseNode } from '@console/topology/src/components/graph-view/components/nodes';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { TYPE_KAFKA_CONNECTION_LINK } from '../../const';

import './EventSource.scss';

export type EventSourceProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const EventSource: React.FC<EventSourceProps> = ({ element, onShowCreateConnector, ...rest }) => {
  const { data, resources } = element.getData();
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const isKafkaConnectionLinkPresent =
    element.getSourceEdges()?.filter((edge: Edge) => edge.getType() === TYPE_KAFKA_CONNECTION_LINK)
      .length > 0;

  return (
    <BaseNode
      className="odc-event-source"
      onShowCreateConnector={isKafkaConnectionLinkPresent && onShowCreateConnector}
      kind={data.kind}
      element={element}
      labelIcon={<SignOutAltIcon />}
      {...rest}
    >
      <image
        x={width * 0.25}
        y={height * 0.25}
        width={size * 0.5}
        height={size * 0.5}
        xlinkHref={getEventSourceIcon(data.kind, resources.obj)}
      />
    </BaseNode>
  );
};

export default observer(EventSource);
