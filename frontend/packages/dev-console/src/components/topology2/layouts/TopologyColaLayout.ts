import { ColaLayout, ColaNode, ColaGroup, ColaLink } from '@console/topology';
import { TYPE_EVENT_SOURCE_LINK, TYPE_KNATIVE_SERVICE, TYPE_REVISION_TRAFFIC } from '../const';

const getRevisionTraffic = (revision: ColaNode, edges: ColaLink[]): number => {
  const edge = edges.find(
    (e) =>
      e.element.getType() === TYPE_REVISION_TRAFFIC && e.element.getTarget() === revision.element,
  );
  return edge ? edge.element.getData().data.percent : 0;
};

export default class TopologyColaLayout extends ColaLayout {
  protected getConstraints(nodes: ColaNode[], groups: ColaGroup[], edges: ColaLink[]): any[] {
    const constraints: any[] = [];
    const revisionSeparation = 100;
    const eventSourceLinkSeparation = 85;
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

          // Sort revisions such that most traffic is to the right
          const revisions = g.leaves.sort((n1, n2) => {
            const traffic1 = getRevisionTraffic(n1, edges);
            const traffic2 = getRevisionTraffic(n1, edges);
            const val = traffic1 - traffic2;
            if (val === 0) {
              return n1.element.getLabel().localeCompare(n2.element.getLabel());
            }
            return val;
          });

          revisions.forEach((n, index) => {
            serviceConstraint.offsets.push({ node: n.index, offset: 0 });
            if (index > 0) {
              // Space out each revision horizontally
              constraints.push({
                axis: 'x',
                left: revisions[index - 1].index,
                right: revisions[index].index,
                gap: n.getRadius() + revisionSeparation,
                equality: true,
              });
            }
          });
          constraints.push(serviceConstraint);

          const eventSourceLinks = edges.filter(
            (e) =>
              e.element.getType() === TYPE_EVENT_SOURCE_LINK &&
              e.target.element.getParent() === g.element,
          );

          if (eventSourceLinks.length) {
            const height = eventSourceLinks.reduce((current: number, nextLink: ColaLink) => {
              return current + nextLink.source.getRadius() + eventSourceLinkSeparation;
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
                offset: nextOffset + (link.source.getRadius() + eventSourceLinkSeparation) / 2,
              });
              // Keep the event sources to the right
              constraints.push({
                axis: 'x',
                left: revisions[0].index,
                right: link.source.index,
                gap: eventSourceLinkDist,
                equality: true,
              });
              nextOffset += link.source.getRadius() + eventSourceLinkSeparation;
            });
            constraints.push(eventSourceConstraint);
          }
        }
      });
    }

    return constraints;
  }
}
