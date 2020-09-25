import {
  ColaLayout,
  ColaNode,
  ColaGroup,
  ColaLink,
  Graph,
  GraphModel,
} from '@patternfly/react-topology';
import { layoutConstraints } from '@console/knative-plugin/src/topology/layouts/layoutConstraints';

export default class TopologyColaLayout extends ColaLayout {
  protected getConstraints(nodes: ColaNode[], groups: ColaGroup[], edges: ColaLink[]): any[] {
    return layoutConstraints(nodes, groups, edges, this.options);
  }

  protected startLayout(
    graph: Graph<GraphModel, any>,
    initialRun: boolean,
    addingNodes: boolean,
  ): void {
    if (graph.getNodes()?.filter((n) => n.isVisible()).length === 0) {
      return;
    }
    super.startLayout(graph, initialRun, addingNodes);
  }
}
