import { EdgeModel, NodeModel } from '@patternfly/react-topology';
import { PipelineKind, TaskKind, PipelineRunKind, PipelineTask } from '../../../types';
import { AddNodeDirection, NodeType } from './const';

// Builder Callbacks
export type NewTaskListNodeCallback = (direction: AddNodeDirection) => void;
export type NewTaskNodeCallback = (resource: TaskKind) => void;
export type RemoveListTaskCallback = () => void;
export type NodeSelectionCallback = (nodeData: BuilderNodeModelData) => void;

// Node Data Models
export type PipelineRunAfterNodeModelData = {
  selected?: boolean;
  task: {
    name: string;
    runAfter?: string[];
  };
};

type FinallyTask = {
  name: string;
  runAfter?: string[];
  error?: string;
  selected?: boolean;
  disableTooltip?: boolean;
  onTaskSelection?: () => void;
};
type FinallyListTask = {
  name: string;
  convertList: (resource: TaskKind) => void;
  onRemoveTask: () => void;
};
type FinallyNodeTask = {
  name: string;
  runAfter: string[];
  selected?: boolean;
  isFinallyTask: boolean;
  finallyTasks: FinallyTask[];
};
export type FinallyNodeData = {
  task: FinallyNodeTask;
};
export type BuilderFinallyNodeData = {
  task: FinallyNodeTask & {
    finallyListTasks?: FinallyListTask[];
    addNewFinallyListNode?: () => void;
  };
};
export type FinallyNodeModel = FinallyNodeData & {
  pipeline: PipelineKind;
  pipelineRun?: PipelineRunKind;
  isFinallyTask: boolean;
};

export type BuilderFinallyNodeModel = BuilderFinallyNodeData & {
  clusterTaskList: TaskKind[];
  namespaceTaskList: TaskKind[];
  namespace: string;
  isFinallyTask: boolean;
};

export type TaskListNodeModelData = PipelineRunAfterNodeModelData & {
  clusterTaskList: TaskKind[];
  namespaceTaskList: TaskKind[];
  onNewTask: NewTaskNodeCallback;
  onRemoveTask: RemoveListTaskCallback | null;
};
export type BuilderNodeModelData = PipelineRunAfterNodeModelData & {
  error?: string;
  task: PipelineTask;
  onAddNode: NewTaskListNodeCallback;
  onNodeSelection: NodeSelectionCallback;
};
export type SpacerNodeModelData = PipelineRunAfterNodeModelData & {};
export type TaskNodeModelData = PipelineRunAfterNodeModelData & {
  task: PipelineTask;
  pipeline?: PipelineKind;
  pipelineRun?: PipelineRunKind;
};

// Graph Models
type PipelineNodeModel<D extends PipelineRunAfterNodeModelData> = NodeModel & {
  data: D;
  type: NodeType;
};
export type PipelineMixedNodeModel = PipelineNodeModel<PipelineRunAfterNodeModelData>;
export type PipelineTaskNodeModel = PipelineNodeModel<TaskNodeModelData>;
export type PipelineBuilderTaskNodeModel = PipelineNodeModel<BuilderNodeModelData>;
export type PipelineTaskListNodeModel = PipelineNodeModel<TaskListNodeModelData>;
export type PipelineFinallyNodeModel = PipelineNodeModel<FinallyNodeModel>;
export type PipelineBuilderFinallyNodeModel = PipelineNodeModel<BuilderFinallyNodeModel>;

export type PipelineEdgeModel = EdgeModel;

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

export type DiamondStateType = {
  tooltipContent: string;
  diamondColor: string;
};
