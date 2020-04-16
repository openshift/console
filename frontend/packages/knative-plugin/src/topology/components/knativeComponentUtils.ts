import { errorModal } from '@console/internal/components/modals';
import {
  GraphElement,
  Edge,
  Node,
  DropTargetSpec,
  DragSourceSpec,
  DragObjectWithType,
  CREATE_CONNECTOR_DROP_TYPE,
  CREATE_CONNECTOR_OPERATION,
  DragSpecOperationType,
} from '@console/topology';
import {
  NodeComponentProps,
  NODE_DRAG_TYPE,
  EDGE_DRAG_TYPE,
  EdgeComponentProps,
  EditableDragOperationType,
} from '@console/dev-console/src/components/topology';
import { TYPE_EVENT_SOURCE_LINK } from '../const';
import { createSinkConnection } from '../knative-topology-utils';

export const MOVE_EV_SRC_CONNECTOR_OPERATION = 'moveeventsourceconnector';

export const nodesEdgeIsDragging = (monitor, props) =>
  monitor.isDragging() &&
  ((monitor.getOperation() === CREATE_CONNECTOR_OPERATION && monitor.getItem() === props.element) ||
    (monitor.getOperation() === MOVE_EV_SRC_CONNECTOR_OPERATION &&
      monitor.getItem().getSource()) === props.element);

export const canDropEventSourceSinkOnNode = (operation: string, edge: Edge, node: Node): boolean =>
  edge.getSource() !== node &&
  operation === MOVE_EV_SRC_CONNECTOR_OPERATION &&
  !node.getTargetEdges().find((e) => e.getSource() === edge.getSource());

export const knativeServiceDropTargetSpec: DropTargetSpec<
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
          title: 'Error moving event source sink',
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
