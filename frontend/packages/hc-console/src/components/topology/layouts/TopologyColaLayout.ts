import { ColaLayout, ColaNode, ColaGroup, ColaLink } from '@console/topology';
import { layoutConstraints } from '@console/knative-plugin/src/topology/layouts/layoutConstraints';

export default class TopologyColaLayout extends ColaLayout {
  protected getConstraints(nodes: ColaNode[], groups: ColaGroup[], edges: ColaLink[]): any[] {
    return layoutConstraints(nodes, groups, edges, this.options);
  }
}
