import {
  GraphElement,
  Graph,
  Edge,
  Node,
  DropTargetSpec,
  DragSourceSpec,
  DragObjectWithType,
  CREATE_CONNECTOR_DROP_TYPE,
  CREATE_CONNECTOR_OPERATION,
  DragSpecOperationType,
  DragEvent,
  isGraph,
} from '@patternfly/react-topology';
import i18next from 'i18next';
import { errorModal } from '@console/internal/components/modals';
import {
  NodeComponentProps,
  NODE_DRAG_TYPE,
  EDGE_DRAG_TYPE,
  EdgeComponentProps,
  EditableDragOperationType,
} from '@console/topology/src/components/graph-view';
import { EventingBrokerModel } from '../../models';
import {
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_SERVICE,
  TYPE_EVENT_PUB_SUB,
  TYPE_SINK_URI,
  TYPE_KAFKA_SINK,
} from '../const';
import {
  createEventSourceKafkaConnection,
  createSinkConnection,
  createSinkPubSubConnection,
} from '../knative-topology-utils';

export const MOVE_EV_SRC_CONNECTOR_OPERATION = 'moveeventsourceconnector';
export const MOVE_PUB_SUB_CONNECTOR_OPERATION = 'movepubsubconnector';
export const CREATE_PUB_SUB_CONNECTOR_OPERATION = 'createpubsubconnector';
export const MOVE_EV_SRC_KAFKA_CONNECTOR_OPERATION = 'moveeventsourcekafkaconnector';
export const CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION = 'createeventsourcekafkaconnector';

export const nodesEdgeIsDragging = (monitor, props) =>
  monitor.isDragging() &&
  (monitor.getOperation() === CREATE_CONNECTOR_OPERATION ||
    (monitor.getOperation() === CREATE_PUB_SUB_CONNECTOR_OPERATION &&
      monitor.getItem() === props.element) ||
    (monitor.getOperation() === CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION &&
      monitor.getItem() === props.element) ||
    (monitor.getOperation() === MOVE_EV_SRC_KAFKA_CONNECTOR_OPERATION &&
      monitor.getItem() === props.element) ||
    (monitor.getOperation() === MOVE_EV_SRC_CONNECTOR_OPERATION &&
      monitor.getItem().getSource()) === props.element);

export const canDropEventSourceSinkOnNode = (operation: string, edge: Edge, node: Node): boolean =>
  edge.getSource() !== node &&
  [TYPE_KNATIVE_SERVICE, TYPE_EVENT_PUB_SUB, TYPE_SINK_URI, TYPE_KAFKA_SINK].includes(
    node.getType(),
  ) &&
  operation === MOVE_EV_SRC_CONNECTOR_OPERATION &&
  !node.getTargetEdges().find((e) => e.getSource() === edge.getSource());

export const canDropPubSubSinkOnNode = (operation: string, edge: Edge, node: Node): boolean =>
  edge.getSource() !== node &&
  (node.getType() === TYPE_KNATIVE_SERVICE || node.getType() === TYPE_KAFKA_SINK) &&
  operation === MOVE_PUB_SUB_CONNECTOR_OPERATION &&
  !node.getTargetEdges().find((e) => e.getSource() === edge.getSource());

export const isEventPubSubDroppable = (source: Node, target: Node) => {
  return (
    source.getType() === TYPE_EVENT_PUB_SUB &&
    !source
      .getSourceEdges()
      .map((e) => e.getTarget())
      .includes(target)
  );
};
const getKnativeTooltip = (monitor): string => {
  switch (monitor.getOperation()?.type) {
    case CREATE_PUB_SUB_CONNECTOR_OPERATION: {
      return monitor.getItem()?.getData()?.resources.obj.kind === EventingBrokerModel.kind
        ? i18next.t('knative-plugin~Add Trigger')
        : i18next.t('knative-plugin~Add Subscription');
    }
    case MOVE_PUB_SUB_CONNECTOR_OPERATION: {
      return monitor.getItem()?.getData()?.resources.obj.kind === EventingBrokerModel.kind
        ? i18next.t('knative-plugin~Move Trigger')
        : i18next.t('knative-plugin~Move Subscription');
    }
    case MOVE_EV_SRC_CONNECTOR_OPERATION: {
      return i18next.t('knative-plugin~Move sink to Service');
    }
    default:
      return '';
  }
};
export const eventSourceSinkDropTargetSpec: DropTargetSpec<
  Edge,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeComponentProps
> = {
  accept: [EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor, props) =>
    (item.getType() === TYPE_EVENT_SOURCE_LINK && item.getSource() !== props.element) ||
    monitor.getOperation()?.type === MOVE_PUB_SUB_CONNECTOR_OPERATION ||
    (monitor.getOperation()?.type === CREATE_PUB_SUB_CONNECTOR_OPERATION &&
      isEventPubSubDroppable(monitor.getItem(), props.element)),
  collect: (monitor, props) => ({
    canDrop:
      monitor.isDragging() &&
      (monitor.getOperation()?.type === MOVE_EV_SRC_CONNECTOR_OPERATION ||
        monitor.getOperation()?.type === MOVE_PUB_SUB_CONNECTOR_OPERATION ||
        (monitor.getOperation()?.type === CREATE_PUB_SUB_CONNECTOR_OPERATION &&
          isEventPubSubDroppable(monitor.getItem(), props.element))),
    dropTarget: monitor.isOver({ shallow: true }),
    edgeDragging: nodesEdgeIsDragging(monitor, props),
    tooltipLabel: getKnativeTooltip(monitor),
    edgeOperation: monitor.getOperation()?.type,
  }),
  dropHint: (item) => {
    const itemData = item.getData();
    if (itemData) {
      const resourceObj = itemData.resources.obj;
      return resourceObj.kind === EventingBrokerModel.kind ? 'createTrigger' : 'createSubscription';
    }
    return 'create';
  },
};

export const pubSubDropTargetSpec: DropTargetSpec<
  Edge,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeComponentProps
> = {
  accept: [EDGE_DRAG_TYPE],
  canDrop: (item, monitor, props) =>
    item.getType() === TYPE_EVENT_SOURCE_LINK && item.getSource() !== props.element,
  collect: (monitor, props) => ({
    canDrop:
      monitor.isDragging() && monitor.getOperation()?.type === MOVE_EV_SRC_CONNECTOR_OPERATION,
    dropTarget: monitor.isOver({ shallow: true }),
    edgeDragging: nodesEdgeIsDragging(monitor, props),
  }),
};

export const sinkUriDropTargetSpec: DropTargetSpec<
  Edge,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeComponentProps
> = {
  accept: [EDGE_DRAG_TYPE],
  canDrop: (item, monitor, props) =>
    item.getType() === TYPE_EVENT_SOURCE_LINK && item.getSource() !== props.element,
  collect: (monitor, props) => ({
    canDrop:
      monitor.isDragging() && monitor.getOperation()?.type === MOVE_EV_SRC_CONNECTOR_OPERATION,
    dropTarget: monitor.isOver({ shallow: true }),
    edgeDragging: nodesEdgeIsDragging(monitor, props),
  }),
};

export const eventSourceLinkDragSourceSpec = (): DragSourceSpec<
  DragObjectWithType,
  DragSpecOperationType<EditableDragOperationType>,
  Node,
  { dragging: boolean },
  EdgeComponentProps
> => ({
  item: { type: EDGE_DRAG_TYPE },
  operation: { type: MOVE_EV_SRC_CONNECTOR_OPERATION, edit: true },
  begin: (monitor, props) => {
    props.element.raise();
    return props.element;
  },
  drag: (event, monitor, props) => {
    props.element.setEndPoint(event.x, event.y);
  },
  end: (dropResult, monitor, props) => {
    props.element.setEndPoint();
    if (
      monitor.didDrop() &&
      dropResult &&
      canDropEventSourceSinkOnNode(monitor.getOperation().type, props.element, dropResult)
    ) {
      createSinkConnection(props.element.getSource(), dropResult).catch((error) => {
        errorModal({
          title: i18next.t('knative-plugin~Error moving event source sink'),
          error: error.message,
          showIcon: true,
        });
      });
    }
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
  }),
});

export const eventSourceKafkaLinkDragSourceSpec = (): DragSourceSpec<
  DragObjectWithType,
  DragSpecOperationType<EditableDragOperationType>,
  Node,
  { dragging: boolean },
  EdgeComponentProps
> => ({
  item: { type: EDGE_DRAG_TYPE },
  operation: { type: MOVE_EV_SRC_KAFKA_CONNECTOR_OPERATION, edit: true },
  begin: (monitor, props) => {
    props.element.raise();
    return props.element;
  },
  drag: (event, monitor, props) => {
    props.element.setEndPoint(event.x, event.y);
  },
  end: (dropResult, monitor, props) => {
    props.element.setEndPoint();
    if (monitor.didDrop() && dropResult) {
      createEventSourceKafkaConnection(props.element.getSource(), dropResult).catch((error) => {
        errorModal({
          title: i18next.t('knative-plugin~Error moving event source kafka connector'),
          error: error?.message,
          showIcon: true,
        });
      });
    }
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
  }),
});

export const eventingPubSubLinkDragSourceSpec = (): DragSourceSpec<
  DragObjectWithType,
  DragSpecOperationType<EditableDragOperationType>,
  Node,
  { dragging: boolean },
  EdgeComponentProps
> => ({
  item: { type: EDGE_DRAG_TYPE },
  operation: { type: MOVE_PUB_SUB_CONNECTOR_OPERATION, edit: true },
  begin: (monitor, props) => {
    props.element.raise();
    return props.element;
  },
  drag: (event, monitor, props) => {
    props.element.setEndPoint(event.x, event.y);
  },
  end: (dropResult, monitor, props) => {
    props.element.setEndPoint();
    if (
      monitor.didDrop() &&
      dropResult &&
      canDropPubSubSinkOnNode(monitor.getOperation().type, props.element, dropResult)
    ) {
      createSinkPubSubConnection(props.element, dropResult).catch((error) => {
        errorModal({
          title: i18next.t('knative-plugin~Error while sink'),
          error: error.message,
          showIcon: true,
        });
      });
    }
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
  }),
});

export const eventSourceTargetSpec: DropTargetSpec<
  GraphElement,
  any,
  {},
  { element: GraphElement }
> = {
  accept: [NODE_DRAG_TYPE, EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: () => {
    return false;
  },
  collect: (monitor, props) => ({
    edgeDragging: nodesEdgeIsDragging(monitor, props),
  }),
};

export const kafkaSourceCreateConnectorCallback = (
  source: Node,
  target: Node | Graph,
  _event: DragEvent,
  dropHints: string[] | undefined,
): Promise<React.ReactElement[] | null> => {
  const createConnectors = target.getGraph()?.getData()?.createConnectorExtensions;
  if (source === target || isGraph(target) || !createConnectors) {
    return null;
  }
  const relationshipProviders = target.getGraph()?.getData()?.relationshipProviderExtensions;
  const curRelProvider = relationshipProviders?.find(({ uid }) => dropHints.includes(uid));
  if (curRelProvider) {
    return curRelProvider.properties.create(source, target);
  }

  const creator = createConnectors.find((getter) => !!getter(dropHints, source, target));
  if (creator) {
    return creator(dropHints, source, target)(source, target);
  }

  return null;
};
