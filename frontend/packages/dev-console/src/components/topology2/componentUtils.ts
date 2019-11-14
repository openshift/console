import {
  Modifiers,
  Edge,
  GraphElement,
  isEdge,
  isNode,
  Node,
  Graph,
  DragSourceSpec,
  DragObjectWithType,
  DropTargetSpec,
  DropTargetMonitor,
  CREATE_CONNECTOR_DROP_TYPE,
  CREATE_CONNECTOR_OPERATION,
} from '@console/topology';
import { createConnection, removeConnection, moveNodeToGroup } from './topology-utils';
import { TYPE_CONNECTS_TO, TYPE_WORKLOAD, TYPE_KNATIVE_SERVICE, TYPE_EVENT_SOURCE } from './const';
import './components/GraphComponent.scss';

type GraphProps = {
  element: Graph;
};

type NodeProps = {
  element: Node;
};

type EdgeProps = {
  element: Edge;
};

const MOVE_CONNECTOR_DROP_TYPE = '#moveConnector#';

const MOVE_CONNECTOR_OPERATION = 'moveconnector';
const REGROUP_OPERATION = 'regroup';

const editOperations = [REGROUP_OPERATION, MOVE_CONNECTOR_OPERATION, CREATE_CONNECTOR_OPERATION];

const highlightNodeOperations = [MOVE_CONNECTOR_OPERATION, CREATE_CONNECTOR_OPERATION];

const canDropEdgeOnNode = (operation: string, edge: Edge, node: Node): boolean => {
  if (edge.getSource() === node) {
    return false;
  }

  if (operation === MOVE_CONNECTOR_OPERATION && edge.getTarget() === node) {
    return true;
  }

  return !node.getTargetEdges().find((e) => e.getSource() === edge.getSource());
};

const highlightNode = (monitor: DropTargetMonitor, props: NodeProps): boolean => {
  if (!monitor.isDragging() || !highlightNodeOperations.includes(monitor.getOperation())) {
    return false;
  }

  if (monitor.getOperation() === CREATE_CONNECTOR_OPERATION) {
    return (
      monitor.getItem() !== props.element &&
      !monitor
        .getItem()
        .getSourceEdges()
        .find((e) => e.getTarget() === props.element)
    );
  }

  return canDropEdgeOnNode(monitor.getOperation(), monitor.getItem(), props.element);
};

const nodeDragSourceSpec = (
  type: string,
  allowRegroup: boolean = true,
): DragSourceSpec<DragObjectWithType, Node, {}, NodeProps> => ({
  item: { type },
  operation: allowRegroup
    ? {
        [Modifiers.SHIFT]: REGROUP_OPERATION,
      }
    : undefined,
  canCancel: (monitor) => monitor.getOperation() === REGROUP_OPERATION,
  end: (dropResult, monitor, props) => {
    if (monitor.didDrop() && dropResult && props && props.element.getParent() !== dropResult) {
      return moveNodeToGroup(props.element, isNode(dropResult) ? dropResult : null);
    }
    return undefined;
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
    regrouping: monitor.getOperation() === REGROUP_OPERATION,
  }),
});

const nodesEdgeIsDragging = (monitor, props) => {
  if (!monitor.isDragging()) {
    return false;
  }
  if (monitor.getOperation() === MOVE_CONNECTOR_OPERATION) {
    return monitor.getItem().getSource() === props.element;
  }
  if (monitor.getOperation() === CREATE_CONNECTOR_OPERATION) {
    return monitor.getItem() === props.element;
  }
  return false;
};

const nodeDropTargetSpec: DropTargetSpec<
  GraphElement,
  any,
  { droppable: boolean; canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeProps
> = {
  accept: [MOVE_CONNECTOR_DROP_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor, props) => {
    if (isEdge(item)) {
      return item.getSource() !== props.element && item.getTarget() !== props.element;
    }
    if (item === props.element) {
      return false;
    }
    return !props.element.getTargetEdges().find((e) => e.getSource() === item);
  },
  collect: (monitor, props) => ({
    droppable: monitor.isDragging(),
    canDrop: highlightNode(monitor, props),
    dropTarget: monitor.isOver(),
    edgeDragging: nodesEdgeIsDragging(monitor, props),
  }),
};

const graphWorkloadDropTargetSpec: DropTargetSpec<
  GraphElement,
  any,
  { dragEditInProgress: boolean },
  GraphProps
> = {
  accept: [TYPE_WORKLOAD, TYPE_KNATIVE_SERVICE, TYPE_EVENT_SOURCE, TYPE_CONNECTS_TO],
  canDrop: (item, monitor, props) => {
    return monitor.getOperation() === REGROUP_OPERATION && item.getParent() !== props.element;
  },
  collect: (monitor) => ({
    dragEditInProgress: monitor.isDragging() && editOperations.includes(monitor.getOperation()),
  }),
};

const groupWorkoadDropTargetSpec: DropTargetSpec<
  any,
  any,
  { droppable: boolean; dropTarget: boolean; canDrop: boolean },
  any
> = {
  accept: [TYPE_WORKLOAD, TYPE_EVENT_SOURCE, TYPE_KNATIVE_SERVICE],
  canDrop: (item, monitor) => monitor.getOperation() === REGROUP_OPERATION,
  collect: (monitor) => ({
    droppable: monitor.isDragging() && monitor.getOperation() === REGROUP_OPERATION,
    dropTarget: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }),
};

const edgeDragSourceSpec = (
  serviceBinding: boolean,
): DragSourceSpec<DragObjectWithType, Node, { dragging: boolean }, EdgeProps> => ({
  item: { type: MOVE_CONNECTOR_DROP_TYPE },
  operation: MOVE_CONNECTOR_OPERATION,
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
      createConnection(
        props.element.getSource(),
        dropResult,
        props.element.getTarget(),
        serviceBinding,
      );
    }
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
  }),
});

const createConnectorCallback = (serviceBinding: boolean) => (
  source: Node,
  target: Node,
): any[] | null => {
  createConnection(source, target, null, serviceBinding);
  return null;
};

const removeConnectorCallback = (edge: Edge): void => {
  removeConnection(edge);
  return null;
};

export {
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  graphWorkloadDropTargetSpec,
  groupWorkoadDropTargetSpec,
  edgeDragSourceSpec,
  createConnectorCallback,
  removeConnectorCallback,
};
