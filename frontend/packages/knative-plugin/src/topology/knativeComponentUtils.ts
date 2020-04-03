import { Edge, DropTargetSpec, CREATE_CONNECTOR_DROP_TYPE } from '@console/topology';
import {
  NodeComponentProps,
  nodesEdgeIsDragging,
} from '@console/dev-console/src/components/topology';

const MOVE_EV_SRC_CONNECTOR_DROP_TYPE = '#moveEvSrcConnector#';

const graphEventSourceDropTargetSpec: DropTargetSpec<
  Edge,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeComponentProps
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

export { graphEventSourceDropTargetSpec, MOVE_EV_SRC_CONNECTOR_DROP_TYPE };
