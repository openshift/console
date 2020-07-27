import * as _ from 'lodash';
import {
  ColaGroup,
  ColaLink,
  ColaNode,
  getGroupPadding,
  LayoutOptions,
} from '@patternfly/react-topology';
import {
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_SERVICE,
  TYPE_EVENT_PUB_SUB,
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_SINK_URI,
} from '../const';

const getNodeTimeStamp = (node: ColaNode): Date => {
  const data = node.element.getData();
  return new Date(_.get(data, 'resources.obj.metadata.creationTimestamp', 0));
};

// Sort nodes most recent to least recent
const nodeSorter = (node1: ColaNode, node2: ColaNode) =>
  getNodeTimeStamp(node1) > getNodeTimeStamp(node2) ? -1 : 1;

const alignLeftNodeConnector = (
  edges: ColaLink[],
  type: string,
  g: ColaGroup | ColaNode,
  options: LayoutOptions,
  filteredNode,
): any[] => {
  const constraints = [];
  const connectorLinks = edges
    .filter(
      (e) =>
        e.element.getType() === type &&
        (e.target.element === g.element || e.target.element.getParent() === g.element),
    )
    .sort((l1: ColaLink, l2: ColaLink) => nodeSorter(l1.source, l2.source));
  if (connectorLinks.length) {
    const height = connectorLinks.reduce((current: number, nextLink: ColaLink) => {
      return current + nextLink.source.height;
    }, 0);
    const serviceDistance =
      g instanceof ColaGroup
        ? (filteredNode as ColaNode).radius + getGroupPadding(g.element)
        : (filteredNode as ColaNode).width / 2;

    const linkSourceConstraint: any = {
      type: 'alignment',
      axis: 'y',
      offsets: [{ node: connectorLinks[0].target.index, offset: 0 }],
    };
    let nextOffset = -height / 2;
    connectorLinks.forEach((link: ColaLink) => {
      // Evenly space out the event sources vertically
      linkSourceConstraint.offsets.push({
        node: link.source.index,
        offset: nextOffset + link.source.height / 2,
      });
      // Keep the event sources to the left
      constraints.push({
        axis: 'x',
        left: link.source.index,
        right: filteredNode.index,
        gap: serviceDistance + link.source.width / 2 + options.linkDistance,
        equality: true,
      });
      nextOffset += link.source.height;
    });
    constraints.push(linkSourceConstraint);
  }
  return constraints;
};

export const layoutConstraints = (
  nodes: ColaNode[],
  groups: ColaGroup[],
  edges: ColaLink[],
  options: LayoutOptions,
): any[] => {
  let constraints: any[] = [];

  [...groups, ...nodes]
    .filter((g) =>
      [TYPE_EVENT_PUB_SUB, TYPE_SINK_URI, TYPE_KNATIVE_SERVICE].includes(g.element.getType()),
    )
    .forEach((g) => {
      const leafNodes = g instanceof ColaGroup && g.leaves.sort(nodeSorter);
      const filteredNode = (leafNodes && _.first(leafNodes)) || g;
      if (g.element.getType() === TYPE_KNATIVE_SERVICE) {
        const serviceConstraint: any = {
          type: 'alignment',
          axis: 'y',
          offsets: [],
        };

        // Sort revisions such that most recent is to the left
        if (leafNodes) {
          for (let i = 0; i < leafNodes.length; i++) {
            serviceConstraint.offsets.push({ node: leafNodes[i].index, offset: 0 });
            if (i < leafNodes.length - 1) {
              // Space out each revision horizontally
              constraints.push({
                axis: 'x',
                left: leafNodes[i].index,
                right: leafNodes[i + 1].index,
                gap: leafNodes[i].width,
                equality: true,
              });
            }
          }
          if (serviceConstraint.offsets.length) {
            constraints.push(serviceConstraint);
          }
        }
      }

      const eventSourceLinksConnector = alignLeftNodeConnector(
        edges,
        TYPE_EVENT_SOURCE_LINK,
        g,
        options,
        filteredNode,
      );

      const pubSubLinksConnector = alignLeftNodeConnector(
        edges,
        TYPE_EVENT_PUB_SUB_LINK,
        g,
        options,
        filteredNode,
      );
      constraints = [...constraints, ...pubSubLinksConnector, ...eventSourceLinksConnector];
    });
  return constraints;
};
