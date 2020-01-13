import * as _ from 'lodash';
import { EdgeModel, NodeModel } from '../types';

const getNodeParent = (nodeId: string, nodes: NodeModel[]): NodeModel | undefined => {
  return nodes.find((n) => n.children?.includes(nodeId));
};

const getDisplayedNodeForNode = (
  nodeId: string | undefined,
  nodes: NodeModel[] | undefined,
): string => {
  if (!nodeId || !nodes) {
    return '';
  }

  let displayedNode = nodes && nodes.find((n) => n.id === nodeId);
  let parent = getNodeParent(nodeId, nodes);
  while (parent) {
    if (parent.collapsed) {
      displayedNode = parent;
    }
    parent = getNodeParent(parent.id, nodes);
  }
  return displayedNode ? displayedNode.id : '';
};

const createAggregateEdges = (
  aggregateEdgeType: string,
  edges: EdgeModel[] | undefined,
  nodes: NodeModel[] | undefined,
): EdgeModel[] => {
  return _.reduce(
    edges,
    (newEdges: EdgeModel[], edge: EdgeModel) => {
      const source = getDisplayedNodeForNode(edge.source, nodes);
      const target = getDisplayedNodeForNode(edge.target, nodes);
      if (source !== edge.source || target !== edge.target) {
        edge.visible = false;
        if (source !== target) {
          const existing = newEdges.find(
            (e) =>
              (e.source === source || e.source === target) &&
              (e.target === target || e.target === source),
          );
          if (existing) {
            existing.type = aggregateEdgeType;
            existing.children && existing.children.push(edge.id);
            if (existing.source !== edge.source) {
              existing.data.bidirectional = true;
            }
          } else {
            const newEdge: EdgeModel = {
              data: { bidirectional: false },
              children: [edge.id],
              source,
              target,
              id: `${source}_${target}`,
              type: edge.type,
            };
            newEdges.push(newEdge);
          }
        }
      } else {
        edge.visible = true;
      }
      newEdges.push(edge);
      return newEdges;
    },
    [] as EdgeModel[],
  );
};

export { createAggregateEdges };
