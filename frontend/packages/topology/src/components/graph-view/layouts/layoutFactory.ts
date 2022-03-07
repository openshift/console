import { Graph, Layout, LayoutFactory } from '@patternfly/react-topology';
import TopologyColaLayout from './TopologyColaLayout';

const COLA_LAYOUT = 'Cola';

const layoutFactory: LayoutFactory = (type: string, graph: Graph): Layout | undefined => {
  return type === COLA_LAYOUT ? new TopologyColaLayout(graph, { layoutOnDrag: false }) : undefined;
};

export { layoutFactory, COLA_LAYOUT };
