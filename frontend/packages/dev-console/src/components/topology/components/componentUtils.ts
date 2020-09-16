import * as React from 'react';
import { action } from 'mobx';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
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
  DragSpecOperationType,
  CREATE_CONNECTOR_DROP_TYPE,
  CREATE_CONNECTOR_OPERATION,
  withContextMenu as withTopologyContextMenu,
  isGraph,
  withDndDrop,
  DragEvent,
  DragOperationWithType,
} from '@patternfly/react-topology';
import { isWorkloadRegroupable } from '../../../utils/application-utils';
import { createConnection } from './createConnection';
import { moveNodeToGroup } from './moveNodeToGroup';
import { graphContextMenu, groupContextMenu } from './nodeContextMenu';

import './GraphComponent.scss';

const MOVE_CONNECTOR_DROP_TYPE = '#moveConnector#';

const NODE_DRAG_TYPE = '#node#';
const EDGE_DRAG_TYPE = '#edge#';

const MOVE_CONNECTOR_OPERATION = 'moveconnector';
const REGROUP_OPERATION = 'regroup';

type GraphComponentProps = {
  element: Graph;
};

type NodeComponentProps = {
  element: Node;
};

type EdgeComponentProps = {
  element: Edge;
};

/**
 * type: the drag operation type
 * edit: true if the operation performs an edit, used to dim invalid drop targets
 * canDropOnNode: true if the drag object can be dropped on node, used to highlight valid drop nodes
 */
type EditableDragOperationType = DragOperationWithType & {
  edit?: boolean;
  canDropOnNode?: (operationType: string, dragElement: GraphElement, node: Node) => boolean;
};

type DragNodeObject = {
  element: GraphElement;
  allowRegroup: boolean;
};

const canDropEdgeOnNode = (operation: string, edge: Edge, node: Node): boolean => {
  if (edge.getSource() === node) {
    return false;
  }

  if (edge.getTarget() === node) {
    return true;
  }

  return !node.getTargetEdges().find((e) => e.getSource() === edge.getSource());
};

const highlightNode = (monitor: DropTargetMonitor, element: Node): boolean => {
  const operation = monitor.getOperation() as EditableDragOperationType;
  if (!monitor.isDragging() || !operation) {
    return false;
  }

  if (operation.type === CREATE_CONNECTOR_OPERATION) {
    return (
      monitor.getItem() !== element &&
      monitor.getItem().getParent() !== element &&
      !monitor
        .getItem()
        .getSourceEdges()
        .find((e) => e.getTarget() === element)
    );
  }

  return (
    operation.canDropOnNode && operation.canDropOnNode(operation.type, monitor.getItem(), element)
  );
};

const nodeDragSourceSpec = (
  type: string,
  allowRegroup: boolean = true,
  canEdit: boolean = false,
): DragSourceSpec<
  DragObjectWithType,
  DragSpecOperationType<EditableDragOperationType>,
  Node,
  {
    dragging?: boolean;
    regrouping?: boolean;
  },
  NodeComponentProps & { canEdit?: boolean }
> => ({
  item: { type: NODE_DRAG_TYPE },
  operation: (monitor, props) => {
    return (canEdit || props.canEdit) && allowRegroup && isWorkloadRegroupable(props.element)
      ? {
          [Modifiers.SHIFT]: { type: REGROUP_OPERATION, edit: true },
        }
      : undefined;
  },
  canCancel: (monitor) => monitor.getOperation()?.type === REGROUP_OPERATION,
  begin: (monitor, props): DragNodeObject => {
    return {
      element: props.element,
      allowRegroup:
        (canEdit || props.canEdit) && allowRegroup && isWorkloadRegroupable(props.element),
    };
  },
  end: async (dropResult, monitor, props) => {
    if (!monitor.isCancelled() && monitor.getOperation()?.type === REGROUP_OPERATION) {
      if (monitor.didDrop() && dropResult && props && props.element.getParent() !== dropResult) {
        const controller = props.element.getController();
        await moveNodeToGroup(props.element, isNode(dropResult) ? (dropResult as Node) : null);

        // perform the optimistic update in an action so as not to render too soon
        action(() => {
          // FIXME: check shouldn't be necessary if we handled the async and backend data refresh correctly
          if (controller.getNodeById(props.element.getId())) {
            dropResult.appendChild(props.element);
          }
        })();
      } else {
        // cancel operation
        return Promise.reject();
      }
    }
    return undefined;
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
    regrouping: monitor.getOperation()?.type === REGROUP_OPERATION,
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
  NodeComponentProps
> = {
  accept: [EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor, props) => {
    if (isEdge(item)) {
      return canDropEdgeOnNode(monitor.getOperation()?.type, item as Edge, props.element);
    }
    if (item === props.element) {
      return false;
    }
    return !props.element.getTargetEdges().find((e) => e.getSource() === item);
  },
  collect: (monitor, props) => ({
    canDrop: highlightNode(monitor, props.element),
    dropTarget: monitor.isOver({ shallow: true }),
    edgeDragging: nodesEdgeIsDragging(monitor, props),
  }),
};

const graphDropTargetSpec: DropTargetSpec<
  DragNodeObject,
  any,
  { dragEditInProgress: boolean },
  GraphComponentProps
> = {
  accept: [NODE_DRAG_TYPE, EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  hitTest: () => true,
  canDrop: (item, monitor, props) => {
    return (
      monitor.isOver({ shallow: monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE }) &&
      ((monitor.getOperation()?.type === REGROUP_OPERATION &&
        // FIXME: the hasParent check is necessary due to model updates during async actions
        item.element.hasParent() &&
        item.element.getParent() !== props.element) ||
        monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE)
    );
  },
  collect: (monitor) => {
    const operation = monitor.getOperation() as EditableDragOperationType;
    const dragEditInProgress =
      monitor.isDragging() && (operation?.type === CREATE_CONNECTOR_OPERATION || operation?.edit);
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

const applicationGroupDropTargetSpec: DropTargetSpec<
  any,
  any,
  { droppable: boolean; dropTarget: boolean; canDrop: boolean },
  any
> = {
  accept: [NODE_DRAG_TYPE, EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor) =>
    monitor.isOver({ shallow: monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE }) &&
    (monitor.getOperation()?.type === REGROUP_OPERATION ||
      monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE),
  collect: (monitor) => {
    return {
      droppable: monitor.isDragging() && monitor.getOperation()?.type === REGROUP_OPERATION,
      dropTarget: monitor.isOver({ shallow: monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE }),
      canDrop:
        monitor.isDragging() &&
        (monitor.getOperation()?.type === REGROUP_OPERATION ||
          monitor.getItemType() === CREATE_CONNECTOR_DROP_TYPE),
      dragRegroupable: monitor.isDragging() && monitor.getItem()?.allowRegroup,
    };
  },
  dropHint: 'create',
};

const edgeDragSourceSpec = (
  type: string,
  callback: (
    sourceNode: Node,
    targetNode: Node,
    replaceTargetNode?: Node,
  ) => Promise<K8sResourceKind[] | K8sResourceKind>,
  failureTitle: string = 'Error moving connection',
): DragSourceSpec<
  DragObjectWithType,
  DragSpecOperationType<EditableDragOperationType>,
  Node,
  { dragging: boolean },
  EdgeComponentProps
> => ({
  item: { type: EDGE_DRAG_TYPE },
  operation: { type: MOVE_CONNECTOR_OPERATION, edit: true, canDropOnNode: canDropEdgeOnNode },
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
      canDropEdgeOnNode(monitor.getOperation()?.type, props.element, dropResult)
    ) {
      callback(props.element.getSource(), dropResult, props.element.getTarget()).catch((error) => {
        errorModal({ title: failureTitle, error: error.message, showIcon: true });
      });
    }
  },
  collect: (monitor) => ({
    dragging: monitor.isDragging(),
  }),
});

const noDropTargetSpec: DropTargetSpec<GraphElement, any, {}, { element: GraphElement }> = {
  accept: [NODE_DRAG_TYPE, EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
  canDrop: () => {
    return false;
  },
};

const withNoDrop = () => {
  return withDndDrop<any, any, {}, NodeComponentProps>(noDropTargetSpec);
};

const withContextMenu = <E extends GraphElement>(actions: (element: E) => React.ReactElement[]) => {
  return withTopologyContextMenu(
    actions,
    document.getElementById('popper-container'),
    'odc-topology-context-menu',
  );
};

const createVisualConnector = (source: Node, target: Node | Graph): React.ReactElement[] | null => {
  if (isGraph(target)) {
    return graphContextMenu(target, source);
  }
  if (target.isGroup()) {
    return groupContextMenu(target, source);
  }

  createConnection(source, target, null).catch((error) => {
    errorModal({ title: 'Error creating connection', error: error.message });
  });

  return null;
};

const createConnectorCallback = () => (
  source: Node,
  target: Node | Graph,
  event: DragEvent,
  dropHints: string[] | undefined,
): Promise<React.ReactElement[] | null> => {
  if (source === target) {
    return null;
  }
  const createConnectors = target.getGraph()?.getData()?.createConnectorExtensions;
  if (isGraph(target) || !createConnectors) {
    return Promise.resolve(createVisualConnector(source, target));
  }

  const creator = createConnectors.find((getter) => !!getter(dropHints));
  if (creator) {
    return creator(dropHints)(source, target);
  }
  return Promise.resolve(createVisualConnector(source, target));
};

export {
  GraphComponentProps,
  NodeComponentProps,
  EdgeComponentProps,
  EditableDragOperationType,
  DragNodeObject,
  nodesEdgeIsDragging,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  graphDropTargetSpec,
  applicationGroupDropTargetSpec,
  edgeDragSourceSpec,
  noDropTargetSpec,
  createConnectorCallback,
  REGROUP_OPERATION,
  MOVE_CONNECTOR_DROP_TYPE,
  NODE_DRAG_TYPE,
  EDGE_DRAG_TYPE,
  withNoDrop,
  withContextMenu,
  canDropEdgeOnNode,
  highlightNode,
};
