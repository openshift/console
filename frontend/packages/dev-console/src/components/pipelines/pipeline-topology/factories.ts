import {
  ComponentFactory,
  DagreLayout,
  GraphComponent,
  LayoutFactory,
  ModelKind,
  Graph,
} from '@console/topology';
import { NodeType, PipelineLayout } from './const';
import BuilderNode from './BuilderNode';
import InvalidTaskListNode from './InvalidTaskListNode';
import SpacerNode from './SpacerNode';
import TaskNode from './TaskNode';
import TaskEdge from './TaskEdge';
import TaskListNode from './TaskListNode';
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
        case NodeType.INVALID_TASK_LIST_NODE:
          return InvalidTaskListNode;
        case NodeType.BUILDER_NODE:
          return BuilderNode;
        default:
          return undefined;
      }
    default:
      return undefined;
  }
};

export const layoutFactory: LayoutFactory = (type: string, graph: Graph) => {
  switch (type) {
    case PipelineLayout.DAGRE_BUILDER:
    case PipelineLayout.DAGRE_VIEWER:
      return new DagreLayout(graph, {
        // Hack to get around undesirable defaults
        // TODO: fix this, it's not ideal but it works for now
        linkDistance: 0,
        nodeDistance: 0,
        groupDistance: 0,
        collideDistance: 0,
        simulationSpeed: 0,
        chargeStrength: 0,
        allowDrag: false,
        layoutOnDrag: false,
        ...getLayoutData(type),
      });
    default:
      return undefined;
  }
};
