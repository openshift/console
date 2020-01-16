import {
  ComponentFactory,
  DagreLayout,
  GraphComponent,
  LayoutFactory,
  ModelKind,
  Graph,
} from '@console/topology';
import { LayoutCallback } from '@console/topology/src/layouts/DagreLayout';
import {
  NODE_SEPARATION_HORIZONTAL,
  NodeType,
  PipelineLayout,
  NODE_SEPARATION_VERTICAL,
} from './const';
import SpacerNode from './SpacerNode';
import TaskNode from './TaskNode';
import TaskEdge from './TaskEdge';

export const componentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
  switch (kind) {
    case ModelKind.graph:
      return GraphComponent;
    case ModelKind.edge:
      return TaskEdge;
    case ModelKind.node:
      switch (type) {
        case NodeType.TASK_NODE:
          return TaskNode;
        case NodeType.SPACER_NODE:
          return SpacerNode;
        default:
          return undefined;
      }
    default:
      return undefined;
  }
};

// TODO: Fix this hack as it's not the best way to get the layout update
type CallbackLayout = (onLayout: LayoutCallback) => LayoutFactory;
export const layoutFactory: CallbackLayout = (onLayout) => (type: string, graph: Graph) => {
  switch (type) {
    case PipelineLayout.DAGRE:
      return new DagreLayout(
        graph,
        {
          nodesep: NODE_SEPARATION_VERTICAL,
          ranksep: NODE_SEPARATION_HORIZONTAL,
          edgesep: 0,
          ranker: 'longest-path',
          rankdir: 'LR',
          align: 'UL',
        },
        { onLayout },
      );
    default:
      return undefined;
  }
};
