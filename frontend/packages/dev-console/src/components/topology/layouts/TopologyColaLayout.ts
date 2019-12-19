import * as _ from 'lodash';
import { ColaLayout, ColaNode, ColaGroup, ColaLink } from '@console/topology';
import { TYPE_EVENT_SOURCE_LINK, TYPE_KNATIVE_SERVICE } from '../const';

const getNodeTimeStamp = (node: ColaNode): Date => {
  const data = node.element.getData();
  return new Date(_.get(data, 'resources.obj.metadata.creationTimestamp', 0));
};

// Sort nodes most recent to least recent
const nodeSorter = (node1: ColaNode, node2: ColaNode) =>
  getNodeTimeStamp(node1) > getNodeTimeStamp(node2) ? -1 : 1;

export default class TopologyColaLayout extends ColaLayout {
  protected getConstraints(nodes: ColaNode[], groups: ColaGroup[], edges: ColaLink[]): any[] {
    const constraints: any[] = [];
    const eventSourceLinkDist = 200;

    if (groups) {
      groups.forEach((g) => {
        // Line up revisions of a knative service in a horizontal line
        if (g.element.getType() === TYPE_KNATIVE_SERVICE) {
          const serviceConstraint: any = {
            type: 'alignment',
            axis: 'y',
            offsets: [],
          };

          // Sort revisions such that most recent is to the left
          const revisions = g.leaves.sort(nodeSorter);

          for (let i = 0; i < revisions.length; i++) {
            serviceConstraint.offsets.push({ node: revisions[i].index, offset: 0 });
            if (i < revisions.length - 1) {
              // Space out each revision horizontally
              constraints.push({
                axis: 'x',
                left: revisions[i].index,
                right: revisions[i + 1].index,
                gap: revisions[i].width,
                equality: true,
              });
            }
          }
          if (serviceConstraint.offsets.length) {
            constraints.push(serviceConstraint);
          }

          const eventSourceLinks = edges
            .filter(
              (e) =>
                e.element.getType() === TYPE_EVENT_SOURCE_LINK &&
                e.target.element.getParent() === g.element,
            )
            .sort((l1: ColaLink, l2: ColaLink) => nodeSorter(l1.source, l2.source));

          if (eventSourceLinks.length) {
            const height = eventSourceLinks.reduce((current: number, nextLink: ColaLink) => {
              return current + nextLink.source.height;
            }, 0);
            const eventSourceConstraint: any = {
              type: 'alignment',
              axis: 'y',
              offsets: [{ node: eventSourceLinks[0].target.index, offset: 0 }],
            };
            let nextOffset = -height / 2;
            eventSourceLinks.forEach((link: ColaLink) => {
              // Evenly space out the event sources vertically
              eventSourceConstraint.offsets.push({
                node: link.source.index,
                offset: nextOffset + link.source.height / 2,
              });
              // Keep the event sources to the right
              constraints.push({
                axis: 'x',
                left: _.last(revisions).index,
                right: link.source.index,
                gap: eventSourceLinkDist,
                equality: true,
              });
              nextOffset += link.source.height;
            });
            constraints.push(eventSourceConstraint);
          }
        }
      });
    }

    return constraints;
  }
}
