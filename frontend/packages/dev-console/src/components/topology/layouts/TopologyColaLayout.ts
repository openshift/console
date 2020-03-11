import { ColaLayout, ColaNode, ColaGroup, ColaLink } from '@console/topology';
import { getColaLayoutConstraints } from '@console/knative-plugin/src/topology/layouts/getColaLayoutConstraints';

export default class TopologyColaLayout extends ColaLayout {
  protected getConstraints(nodes: ColaNode[], groups: ColaGroup[], edges: ColaLink[]): any[] {
    return getColaLayoutConstraints(nodes, groups, edges);
  }
}
