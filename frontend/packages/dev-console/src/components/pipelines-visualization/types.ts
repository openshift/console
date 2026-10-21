import type { RunStatus, WhenStatus } from '@patternfly/react-topology';
import type { NodeModel } from '@patternfly/react-topology/src/types';
import type { GraphLabel } from 'dagre';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions';
import type { ComputedStatus } from '@console/shipwright-plugin/src/components/logs/log-snippet-types';
import type { TektonTaskSpec } from '../../types/coreTekton';
import type { PipelineKind, PipelineRunKind, PipelineTask } from '../../types/pipeline';

export const NODE_WIDTH = 120;
export const NODE_HEIGHT = 30;
export const DEFAULT_BADGE_WIDTH = 40;
export const NODE_PADDING = 12;
export const DEFAULT_NODE_ICON_WIDTH = 30;
export const DEFAULT_FINALLLY_GROUP_PADDING = 35;
export const DEFAULT_NODE_HEIGHT = 32;
export const NODE_SEPARATION_HORIZONTAL = 25;
export const NODE_SEPARATION_VERTICAL = 20;
export const DROP_SHADOW_SPACING = 5;
export const BUILDER_NODE_ADD_RADIUS = 9;
export const BUILDER_NODE_DECORATOR_RADIUS = 9;
export const BUILDER_NODE_ADD_PADDING = 4;
export const WHEN_EXPRESSION_SPACING = 25;
export const TOOLBAR_HEIGHT = 40;
export const GRAPH_MIN_WIDTH = 300;
export const GRAPH_MAX_HEIGHT_PERCENT = 45;
export const FLAG_PIPELINES_OPERATOR_VERSION_1_17_OR_NEWER =
  'PIPELINES_OPERATOR_VERSION_1_17_OR_NEWER';

const DAGRE_SHARED_PROPS: GraphLabel = {
  nodesep: NODE_SEPARATION_VERTICAL,
  ranksep: NODE_SEPARATION_HORIZONTAL,
  edgesep: 50,
  ranker: 'longest-path',
  rankdir: 'LR',
  marginx: 20,
  marginy: 20,
};
export const DAGRE_VIEWER_PROPS: GraphLabel = {
  ...DAGRE_SHARED_PROPS,
};
export const DAGRE_VIEWER_SPACED_PROPS: GraphLabel = {
  ...DAGRE_VIEWER_PROPS,
  ranksep: NODE_SEPARATION_HORIZONTAL + WHEN_EXPRESSION_SPACING,
};
export const DAGRE_BUILDER_PROPS: GraphLabel = {
  ...DAGRE_SHARED_PROPS,
  ranksep: NODE_SEPARATION_HORIZONTAL + BUILDER_NODE_ADD_RADIUS * 2,
  nodesep: NODE_SEPARATION_VERTICAL + BUILDER_NODE_ADD_RADIUS,
  marginx: DAGRE_SHARED_PROPS.marginx + BUILDER_NODE_ADD_RADIUS * 2,
  marginy: DAGRE_SHARED_PROPS.marginy + BUILDER_NODE_ADD_RADIUS * 2,
};

export const DAGRE_BUILDER_SPACED_PROPS: GraphLabel = {
  ...DAGRE_BUILDER_PROPS,
  ranksep: NODE_SEPARATION_HORIZONTAL + WHEN_EXPRESSION_SPACING + BUILDER_NODE_ADD_RADIUS * 2,
};

export enum NodeType {
  TASK_NODE = 'task',
  CUSTOM_TASK_NODE = 'custom-task',
  SPACER_NODE = 'spacer',
  LOADING_NODE = 'loading',
  TASK_LIST_NODE = 'task-list',
  BUILDER_NODE = 'builder',
  INVALID_TASK_LIST_NODE = 'invalid-task-list',
  FINALLY_NODE = 'finally-node',
  BUILDER_FINALLY_NODE = 'builder-finally-node',
  FINALLY_GROUP = 'finally-group',
  EDGE = 'edge',
}

export enum PipelineLayout {
  DAGRE_BUILDER = 'dagre-builder',
  DAGRE_BUILDER_SPACED = 'dagre-builder-spaced',
  DAGRE_VIEWER = 'dagre-viewer',
  DAGRE_VIEWER_SPACED = 'dagre-viewer-spaced',
}

// Node Data Models
export type PipelineRunAfterNodeModelData = {
  id?: string;
  width?: number;
  height?: number;
  selected?: boolean;
  status?: RunStatus;
  whenStatus?: WhenStatus;
  pipeline?: PipelineKind;
  pipelineRun?: PipelineRunKind;
  label?: string;
  runAfterTasks?: string[];
  task: {
    name: string;
    runAfter?: string[];
  };
};

// Graph Models
type PipelineNodeModel<D extends PipelineRunAfterNodeModelData> = NodeModel & {
  data: D;
  type: NodeType;
};

export type PipelineMixedNodeModel = PipelineNodeModel<PipelineRunAfterNodeModelData>;

// Node Creators
export type NodeCreator<D extends PipelineRunAfterNodeModelData> = (
  name: string,
  data: D,
) => PipelineNodeModel<D>;
export type NodeCreatorSetup = (
  type: NodeType,
  width?: number,
  height?: number,
) => NodeCreator<PipelineRunAfterNodeModelData>;

export type TaskKind = K8sResourceCommon & {
  spec: TektonTaskSpec;
};

export type StepStatus = {
  duration: string | null;
  name: string;
  status: ComputedStatus;
};

export interface StatusMessage {
  message: string;
  pftoken: { name: string; value: string; var: string };
}

export type TaskNodeModelData = PipelineRunAfterNodeModelData & {
  task: PipelineTask;
  pipeline?: PipelineKind;
  pipelineRun?: PipelineRunKind;
};
