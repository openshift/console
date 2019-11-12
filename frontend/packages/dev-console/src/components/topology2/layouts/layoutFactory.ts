import { Graph, Layout, LayoutFactory } from '@console/topology';
import TopologyColaLayout from './TopologyColaLayout';

const layoutFactory: LayoutFactory = (type: string, graph: Graph): Layout | undefined => {
  switch (type) {
    case 'Cola':
      return new TopologyColaLayout(graph, { linkDistance: 80 });
    default:
      return undefined;
  }
};

export default layoutFactory;
