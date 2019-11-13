import * as _ from 'lodash';
import { GraphElement, Node, isNode, isGraph, GroupStyle } from '../types';

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

const getElementPadding = (element: GraphElement): number => {
  const stylePadding = element.getStyle<GroupStyle>().padding;
  if (!stylePadding) {
    return 0;
  }

  if (Array.isArray(stylePadding)) {
    // For a padding that is not consistent on all sides, create a best guess padding
    // of twice the average padding (decent guess for square/rectangular shapes)
    return (
      (stylePadding.reduce((val, current) => {
        return val + current;
      }, 0) /
        stylePadding.length) *
      2
    );
  }

  return stylePadding as number;
};

const getGroupPadding = (element: GraphElement, padding = 0): number => {
  if (isGraph(element)) {
    return padding;
  }
  let newPadding = padding;
  if (isNode(element) && element.isGroup()) {
    newPadding += getElementPadding(element);
  }
  if (element.getParent()) {
    return getGroupPadding(element.getParent(), newPadding);
  }
  return newPadding;
};

export { groupNodeElements, leafNodeElements, getElementPadding, getGroupPadding };
