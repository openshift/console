import type { ReactNode, FC } from 'react';
import type {
  Node,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  WithDragNodeProps,
  Edge,
} from '@patternfly/react-topology';
import { observer } from '@patternfly/react-topology';
import type { WithCreateConnectorProps } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { BaseNode } from '@console/topology/src/components/graph-view/components/nodes';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSourceIcon } from '../../../utils/icons';
import { TYPE_KAFKA_CONNECTION_LINK } from '../../const';

import './EventSource.scss';

export type EventSourceProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
  children?: ReactNode;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const EventSource: FC<EventSourceProps> = ({
  element,
  onShowCreateConnector,
  children,
  ...rest
}) => {
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
      labelIcon={<EventSourceIcon />}
      {...rest}
    >
      <circle
        cx={width * 0.5}
        cy={height * 0.5}
        r={width * 0.25 + 6}
        fill="var(--pf-t--color--white)"
      />
      {typeof getEventSourceIcon(data.kind, resources.obj) === 'string' ? (
        <image
          x={width * 0.25}
          y={height * 0.25}
          width={size * 0.5}
          height={size * 0.5}
          xlinkHref={getEventSourceIcon(data.kind, resources.obj, element.getType()) as string}
        />
      ) : (
        <foreignObject
          x={width * 0.25}
          y={height * 0.25}
          width={size * 0.5}
          height={size * 0.5}
          className="odc-event-source__svg-icon"
        >
          {getEventSourceIcon(data.kind, resources.obj, element.getType())}
        </foreignObject>
      )}
      {children}
    </BaseNode>
  );
};

export default observer(EventSource);
