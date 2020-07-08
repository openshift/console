import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import {
  observer,
  Node,
  Edge,
  GraphElement,
  isEdge,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  CREATE_CONNECTOR_DROP_TYPE,
  CREATE_CONNECTOR_OPERATION,
  DropTargetMonitor,
  DropTargetSpec,
  useDndDrop,
} from '@patternfly/react-topology';
import { getServiceBindingStatus } from '../../topology-utils';
import { WorkloadNode } from '../../components/nodes';
import {
  EDGE_DRAG_TYPE,
  EditableDragOperationType,
  NodeComponentProps,
  nodesEdgeIsDragging,
} from '../../components';

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

interface StateProps {
  serviceBinding: boolean;
}

const nodeDropTargetSpec = (
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
    return !props.element.getTargetEdges().find((e) => e.getSource() === item);
  },
  collect: (monitor, props) => {
    return {
      canDrop: highlightNode(monitor, props.element),
      dropTarget: monitor.isOver({ shallow: true }),
      edgeDragging: nodesEdgeIsDragging(monitor, props),
    };
  },
  dropHint: serviceBinding ? 'createServiceBinding' : 'create',
});

export type OperatorWorkloadNodeProps = {
  element: Node;
  hover?: boolean;
  dragging?: boolean;
  highlight?: boolean;
  canDrop?: boolean;
  edgeDragging?: boolean;
  dropTarget?: boolean;
  urlAnchorRef?: React.Ref<SVGCircleElement>;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps &
  StateProps;

const ConnectedOperatorWorkloadNode: React.FC<OperatorWorkloadNodeProps> = ({
  serviceBinding,
  ...rest
}) => {
  const spec = React.useMemo(() => nodeDropTargetSpec(serviceBinding), [serviceBinding]);
  const [dndDropProps, dndDropRef] = useDndDrop(spec, rest as any);
  return (
    <WorkloadNode
      dropTooltip={serviceBinding && 'Create a binding connector'}
      {...rest}
      dndDropRef={dndDropRef}
      {...dndDropProps}
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    serviceBinding: getServiceBindingStatus(state),
  };
};

const OperatorWorkloadNode = connect(mapStateToProps)(observer(ConnectedOperatorWorkloadNode));
export { OperatorWorkloadNode };
