import {
  ComponentFactory,
  DagreLayout,
  GraphComponent,
  LayoutFactory,
  ModelKind,
  Graph,
} from '@console/topology';
import { LayoutCallback } from '@console/topology/src/layouts/DagreLayout';
import { NodeType, PipelineLayout } from './const';
import SpacerNode from './SpacerNode';
import TaskNode from './TaskNode';
import TaskEdge from './TaskEdge';
import TaskListNode from './TaskListNode';
import BuilderNode from './BuilderNode';
import { getLayoutData } from './utils';

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
        case NodeType.TASK_LIST_NODE:
          return TaskListNode;
        case NodeType.BUILDER_NODE:
          return BuilderNode;
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
    case PipelineLayout.DAGRE_BUILDER:
    case PipelineLayout.DAGRE_VIEWER:
      return new DagreLayout(graph, getLayoutData(type), { onLayout });
    default:
      return undefined;
  }
};
