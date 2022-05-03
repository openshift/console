import { Graph, Layout, LayoutFactory } from '@patternfly/react-topology';
import TopologyColaLayout from './TopologyColaLayout';

const COLA_LAYOUT = 'Cola';

const DEFAULT_LAYOUT = COLA_LAYOUT;

const SUPPORTED_LAYOUTS = [COLA_LAYOUT];

const layoutFactory: LayoutFactory = (type: string, graph: Graph): Layout | undefined => {
  return type === COLA_LAYOUT ? new TopologyColaLayout(graph, { layoutOnDrag: false }) : undefined;
};

export { COLA_LAYOUT, DEFAULT_LAYOUT, SUPPORTED_LAYOUTS, layoutFactory };
