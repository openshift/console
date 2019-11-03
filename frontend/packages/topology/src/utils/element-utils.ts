import * as _ from 'lodash';
import { GraphElement, Node, isNode } from '../types';

const groupNodeElements = (nodes: GraphElement[]): Node[] => {
  if (!_.size(nodes)) {
    return [];
  }
  const groupNodes: Node[] = [];
  _.forEach(nodes, (nextNode) => {
    if (isNode(nextNode) && nextNode.isGroup()) {
      groupNodes.push(nextNode);
      groupNodes.push(...groupNodeElements(nextNode.getChildren()));
    }
  });
  return groupNodes;
};

const leafNodeElements = (nodeElements: Node | Node[] | null): Node[] => {
  const nodes: Node[] = [];

  if (!nodeElements) {
    return nodes;
  }

  if (Array.isArray(nodeElements)) {
    _.forEach(nodeElements, (nodeElement: Node) => {
      nodes.push(...leafNodeElements(nodeElement));
    });
    return nodes;
  }

  const children: GraphElement[] = nodeElements.getChildren();
  if (_.size(children)) {
    const leafNodes: Node[] = [];
    _.forEach(children.filter((e) => isNode(e)), (element: Node) => {
      leafNodes.push(...leafNodeElements(element));
    });
    return leafNodes;
  }

  return [nodeElements];
};

export { groupNodeElements, leafNodeElements };
