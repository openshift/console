import {
  CREATE_CONNECTOR_DROP_TYPE,
  DropTargetSpec,
  GraphElement,
  isEdge,
} from '@patternfly/react-topology';
import i18next from 'i18next';
import {
  CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION,
  MOVE_EV_SRC_KAFKA_CONNECTOR_OPERATION,
  nodesEdgeIsDragging,
} from '@console/knative-plugin/src/topology/components/knativeComponentUtils';
import { TYPE_KAFKA_CONNECTION_LINK } from '@console/knative-plugin/src/topology/const';
import {
  canDropEdgeOnNode,
  EDGE_DRAG_TYPE,
  highlightNode,
  NodeComponentProps,
} from '@console/topology/src/components/graph-view';

const getKafkaConnectionTooltip = (monitor): string => {
  return monitor.getOperation()?.type === MOVE_EV_SRC_KAFKA_CONNECTOR_OPERATION ||
    monitor.getOperation()?.type === CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION
    ? i18next.t('rhoas-plugin~Create a Kafka connector')
    : i18next.t('rhoas-plugin~Create a binding connector');
};

export const obsOrKafkaConnectionDropTargetSpec = (
  serviceBinding: boolean,
): DropTargetSpec<
  GraphElement,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeComponentProps
> => ({
  accept: [EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor, props) => {
    if (isEdge(item)) {
      return canDropEdgeOnNode(monitor.getOperation()?.type, item, props.element);
    }
    if (item === props.element) {
      return false;
    }
    return (
      !props.element.getTargetEdges().find((e) => e.getSource() === item) ||
      item.getType() === TYPE_KAFKA_CONNECTION_LINK
    );
  },
  collect: (monitor, props) => {
    return {
      canDrop:
        (serviceBinding && highlightNode(monitor, props.element)) ||
        monitor.getOperation()?.type === MOVE_EV_SRC_KAFKA_CONNECTOR_OPERATION ||
        monitor.getOperation()?.type === CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION,
      dropTarget: monitor.isOver({ shallow: true }),
      edgeDragging: nodesEdgeIsDragging(monitor, props),
      tooltipLabel: getKafkaConnectionTooltip(monitor),
    };
  },
  dropHint: (item, monitor) =>
    monitor.getOperation()?.type === MOVE_EV_SRC_KAFKA_CONNECTOR_OPERATION ||
    monitor.getOperation()?.type === CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION
      ? 'createKafkaConnection'
      : 'createServiceBinding',
});
