import * as dagre from 'dagre';

export const NODE_SEPARATION_HORIZONTAL = 25;
export const NODE_SEPARATION_VERTICAL = 20;
export const DROP_SHADOW_SPACING = 5;
export const BUILDER_NODE_ADD_RADIUS = 10;
export const BUILDER_NODE_ERROR_RADIUS = 9;

export const NODE_WIDTH = 120;
export const NODE_HEIGHT = 30;

export enum NodeType {
  TASK_NODE = 'task',
  SPACER_NODE = 'spacer',
  TASK_LIST_NODE = 'task-list',
  BUILDER_NODE = 'builder',
}
export enum DrawDesign {
  INTEGRAL_SHAPE = 'integral-shape',
  STRAIGHT = 'line',
}
export enum PipelineLayout {
  DAGRE_BUILDER = 'dagre-builder',
  DAGRE_VIEWER = 'dagre-viewer',
}

export enum AddNodeDirection {
  BEFORE = 'in-run-after',
  AFTER = 'has-run-after',
  PARALLEL = 'shared-parallel',
}

const DAGRE_SHARED_PROPS: dagre.GraphLabel = {
  nodesep: NODE_SEPARATION_VERTICAL,
  ranksep: NODE_SEPARATION_HORIZONTAL,
  edgesep: 0,
  ranker: 'longest-path',
  rankdir: 'LR',
  align: 'UL',
};
export const DAGRE_VIEWER_PROPS: dagre.GraphLabel = {
  ...DAGRE_SHARED_PROPS,
};
export const DAGRE_BUILDER_PROPS: dagre.GraphLabel = {
  ...DAGRE_SHARED_PROPS,
  ranksep: NODE_SEPARATION_HORIZONTAL + BUILDER_NODE_ADD_RADIUS,
  marginx: 30,
  marginy: 30,
};
