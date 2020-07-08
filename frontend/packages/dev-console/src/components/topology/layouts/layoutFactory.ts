import { Graph, Layout, LayoutFactory } from '@patternfly/react-topology';
import TopologyColaLayout from './TopologyColaLayout';

const COLA_LAYOUT = 'Cola';
const COLA_FORCE_LAYOUT = 'ColaForce';

const layoutFactory: LayoutFactory = (type: string, graph: Graph): Layout | undefined => {
  switch (type) {
    case COLA_FORCE_LAYOUT:
      return new TopologyColaLayout(graph, { layoutOnDrag: true });
    case COLA_LAYOUT:
      return new TopologyColaLayout(graph, { layoutOnDrag: false });
    default:
      return undefined;
  }
};

export { layoutFactory, COLA_LAYOUT, COLA_FORCE_LAYOUT };
