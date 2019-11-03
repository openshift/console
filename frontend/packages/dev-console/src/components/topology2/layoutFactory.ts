import { Graph, Layout, LayoutFactory, ForceLayout } from '@console/topology';

const layoutFactory: LayoutFactory = (type: string, graph: Graph): Layout | undefined => {
  switch (type) {
    case 'Force':
      return new ForceLayout(graph, {
        linkDistance: 80,
        collideDistance: 30,
        chargeStrength: -50,
      });
    default:
      return undefined;
  }
};

export default layoutFactory;
