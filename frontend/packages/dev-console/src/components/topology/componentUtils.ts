import * as React from 'react';
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
  isGraph,
} from '@console/topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createConnection } from './components/createConnection';
import { removeConnection } from './components/removeConnection';
import { moveNodeToGroup } from './components/moveNodeToGroup';
import { TYPE_WORKLOAD, TYPE_KNATIVE_SERVICE, TYPE_EVENT_SOURCE } from './const';
import './components/GraphComponent.scss';
import { graphContextMenu, groupContextMenu } from './nodeContextMenu';
import { errorModal } from '@console/internal/components/modals';

type GraphProps = {
  element: Graph;
};

type NodeProps = {
  element: Node;
  canEdit?: boolean;
};

type EdgeProps = {
  element: Edge;
};

const MOVE_CONNECTOR_DROP_TYPE = '#moveConnector#';
const MOVE_EV_SRC_CONNECTOR_DROP_TYPE = '#moveEvSrcConnector#';

const MOVE_CONNECTOR_OPERATION = 'moveconnector';
const REGROUP_OPERATION = 'regroup';

const editOperations = [REGROUP_OPERATION, MOVE_CONNECTOR_OPERATION, CREATE_CONNECTOR_OPERATION];

const regroupTypes = [TYPE_WORKLOAD, TYPE_KNATIVE_SERVICE, TYPE_EVENT_SOURCE];

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

  if (monitor.getItemType() === MOVE_EV_SRC_CONNECTOR_DROP_TYPE) {
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
  canEdit: boolean = false,
): DragSourceSpec<
  DragObjectWithType,
  Node,
  {
    dragging?: boolean;
    regrouping?: boolean;
  },
  NodeProps
> => ({
  item: { type },
  operation: (monitor, props) => {
    return (canEdit || props.canEdit) && allowRegroup
      ? {
          [Modifiers.SHIFT]: REGROUP_OPERATION,
        }
      : undefined;
  },
  canCancel: (monitor) => monitor.getOperation() === REGROUP_OPERATION,
  end: async (dropResult, monitor, props) => {
    if (!monitor.isCancelled() && monitor.getOperation() === REGROUP_OPERATION) {
      if (monitor.didDrop() && dropResult && props && props.element.getParent() !== dropResult) {
        await moveNodeToGroup(props.element, isNode(dropResult) ? dropResult : null);
        dropResult.appendChild(props.element);
      } else {
        // cancel operation
        return Promise.reject();
      }
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
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeProps
> = {
  accept: [MOVE_CONNECTOR_DROP_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor, props) => {
    if (isEdge(item)) {
      return canDropEdgeOnNode(monitor.getOperation(), item, props.element);
    }
    if (item === props.element) {
      return false;
    }
    return !props.element.getTargetEdges().find((e) => e.getSource() === item);
  },
  collect: (monitor, props) => ({
    canDrop: highlightNode(monitor, props),
    dropTarget: monitor.isOver({ shallow: true }),
    edgeDragging: nodesEdgeIsDragging(monitor, props),
  }),
};

const graphWorkloadDropTargetSpec: DropTargetSpec<
  GraphElement,
  any,
  { dragEditInProgress: boolean },
  GraphProps
> = {
  accept: [...regroupTypes, CREATE_CONNECTOR_DROP_TYPE],
  hitTest: () => true,
  canDrop: (item, monitor, props) => {
    return (
      monitor.isOver({ shallow: monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE }) &&
      ((monitor.getOperation() === REGROUP_OPERATION && item.getParent() !== props.element) ||
        monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE)
    );
  },
  collect: (monitor) => {
    const dragEditInProgress =
      monitor.isDragging() && editOperations.includes(monitor.getOperation());
    const dragCreate =
      dragEditInProgress &&
      (monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE ||
        monitor.getItemType() === MOVE_CONNECTOR_DROP_TYPE);
    return {
      dragEditInProgress,
      dragCreate,
      hasDropTarget: dragEditInProgress && monitor.hasDropTarget(),
    };
  },
  dropHint: 'create',
};

const groupWorkloadDropTargetSpec: DropTargetSpec<
  any,
  any,
  { droppable: boolean; dropTarget: boolean; canDrop: boolean },
  any
> = {
  accept: [...regroupTypes, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor) =>
    monitor.isOver({ shallow: monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE }) &&
    (monitor.getOperation() === REGROUP_OPERATION ||
      monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE),
  collect: (monitor) => ({
    droppable: monitor.isDragging() && monitor.getOperation() === REGROUP_OPERATION,
    dropTarget: monitor.isOver({ shallow: monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE }),
    canDrop:
      monitor.isDragging() &&
      (monitor.getOperation() === REGROUP_OPERATION ||
        monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE),
  }),
  dropHint: 'create',
};

const graphEventSourceDropTargetSpec: DropTargetSpec<
  Edge,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeProps
> = {
  accept: [CREATE_CONNECTOR_DROP_TYPE, MOVE_EV_SRC_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor, props) => {
    return (
      monitor.getOperation() === MOVE_EV_SRC_CONNECTOR_DROP_TYPE &&
      item.getSource() !== props.element
    );
  },
  collect: (monitor, props) => ({
    canDrop:
      monitor.isDragging() &&
      monitor.getOperation() === MOVE_EV_SRC_CONNECTOR_DROP_TYPE &&
      monitor.canDrop(),
    dropTarget: monitor.isOver({ shallow: true }),
    edgeDragging: nodesEdgeIsDragging(monitor, props),
  }),
};

const edgeDragSourceSpec = (
  type: string,
  serviceBinding: boolean,
  callback: (
    sourceNode: Node,
    targetNode: Node,
    replaceTargetNode?: Node,
    serviceBindingFlag?: boolean,
  ) => Promise<K8sResourceKind[] | K8sResourceKind>,
  failureTitle: string = 'Error moving connection',
): DragSourceSpec<DragObjectWithType, Node, { dragging: boolean }, EdgeProps> => ({
  item: { type },
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
    if (monitor.didDrop() && dropResult && canDropEdgeOnNode('', props.element, dropResult)) {
      callback(
        props.element.getSource(),
        dropResult,
        props.element.getTarget(),
        serviceBinding,
      ).catch((error) => {
        errorModal({ title: failureTitle, error: error.message, showIcon: true });
      });
    }
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
  }),
});

const noDropTargetSpec: DropTargetSpec<GraphElement, any, {}, { element: GraphElement }> = {
  accept: [...regroupTypes, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: () => {
    return false;
  },
};

const createConnectorCallback = (serviceBinding: boolean) => (
  source: Node,
  target: Node | Graph,
): React.ReactElement[] | null => {
  if (source === target) {
    return null;
  }

  if (isGraph(target)) {
    return graphContextMenu(target, source);
  }
  if (target.isGroup()) {
    return groupContextMenu(target, source);
  }
  createConnection(source, target, null, serviceBinding).catch((error) => {
    errorModal({ title: 'Error creating connection', error: error.message });
  });
  return null;
};

const removeConnectorCallback = (edge: Edge): void => {
  removeConnection(edge).catch((error) => {
    errorModal({ title: 'Error removing connection', error: error.message });
  });
  return null;
};

export {
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  graphWorkloadDropTargetSpec,
  groupWorkloadDropTargetSpec,
  graphEventSourceDropTargetSpec,
  edgeDragSourceSpec,
  noDropTargetSpec,
  createConnectorCallback,
  removeConnectorCallback,
  MOVE_CONNECTOR_DROP_TYPE,
  MOVE_EV_SRC_CONNECTOR_DROP_TYPE,
};
