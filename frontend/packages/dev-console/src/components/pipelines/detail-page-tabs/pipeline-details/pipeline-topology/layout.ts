import {
  ComponentFactory,
  DagreLayout,
  GraphComponent,
  LayoutFactory,
  ModelKind,
  Graph,
} from '@console/topology';
import TaskNode from './TaskNode';
import TaskEdge from './TaskEdge';

export const componentFactory: ComponentFactory = (kind: ModelKind) => {
  switch (kind) {
    case ModelKind.graph:
      return GraphComponent;
    case ModelKind.node:
      return TaskNode;
    case ModelKind.edge:
      return TaskEdge;
    default:
      return undefined;
  }
};

export const layoutFactory: LayoutFactory = (type: string, graph: Graph) => {
  switch (type) {
    case 'Dagre':
      return new DagreLayout(graph, {
        nodesep: 20,
        ranksep: 32,
        edgesep: 20,
        ranker: 'longest-path',
        rankdir: 'LR',
        align: 'UL',
      });
    default:
      return undefined;
  }
};
