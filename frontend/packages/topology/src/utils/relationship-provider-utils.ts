import {
  CREATE_CONNECTOR_DROP_TYPE,
  DropTargetSpec,
  GraphElement,
  isEdge,
  isNode,
} from '@patternfly/react-topology';
import {
  canDropEdgeOnNode,
  EDGE_DRAG_TYPE,
  NodeComponentProps,
  nodesEdgeIsDragging,
} from '../components/graph-view';
import { OdcBaseEdge, OdcBaseNode } from '../elements';

export const getRelationshipProvider = (): DropTargetSpec<
  GraphElement,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean; tooltipLabel: string },
  NodeComponentProps
> => {
  const getSourceNode = (monitor) =>
    monitor.getItem() instanceof OdcBaseEdge ? monitor.getItem().getSource() : monitor.getItem();

  const isEdgeConnected = (monitor, targetNode) => {
    const sourceNode = getSourceNode(monitor);
    return (
      sourceNode instanceof OdcBaseNode &&
      sourceNode.getSourceEdges().find((e) => e.getTarget() === targetNode)
    );
  };

  const getRelExtension = (monitor, props) => {
    const sourceNode = getSourceNode(monitor);
    const targetNode = props.element;

    const topologyRelationshipExtensions = targetNode.getGraph()?.getData()
      ?.relationshipProviderExtensions;
    const relationshipExtension =
      sourceNode instanceof OdcBaseNode &&
      targetNode instanceof OdcBaseNode &&
      isNode(sourceNode) &&
      isNode(targetNode)
        ? topologyRelationshipExtensions?.filter(({ properties: { provides } }) =>
            provides(sourceNode, targetNode),
          )
        : [];
    return (
      relationshipExtension.length > 0 &&
      relationshipExtension.sort((a, b) => b.properties?.priority - a.properties?.priority)[0]
    );
  };

  return {
    accept: [EDGE_DRAG_TYPE, CREATE_CONNECTOR_DROP_TYPE],
    canDrop: (item, monitor, props) => {
      if (isEdge(item)) {
        return canDropEdgeOnNode(monitor.getOperation()?.type, item, props.element);
      }
      if (item === props.element) {
        return false;
      }
      const relationshipExtension = getRelExtension(monitor, props);
      return !!relationshipExtension && !isEdgeConnected(monitor, props.element);
    },
    collect: (monitor, props) => {
      const relationshipExtension = getRelExtension(monitor, props);
      return {
        canDrop: !!relationshipExtension && !isEdgeConnected(monitor, props.element),
        dropTarget: monitor.isOver({ shallow: true }),
        edgeDragging: nodesEdgeIsDragging(monitor, props),
        tooltipLabel: relationshipExtension?.properties?.tooltip,
      };
    },
    dropHint: (item, monitor, props) => {
      const relationshipExtension = getRelExtension(monitor, props);
      return relationshipExtension?.uid;
    },
  };
};
