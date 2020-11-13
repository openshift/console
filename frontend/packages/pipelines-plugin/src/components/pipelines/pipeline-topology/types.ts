import { EdgeModel, NodeModel } from '@patternfly/react-topology';
import { Pipeline, PipelineResourceTask, PipelineRun } from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { AddNodeDirection, NodeType } from './const';

// Builder Callbacks
export type NewTaskListNodeCallback = (direction: AddNodeDirection) => void;
export type NewTaskNodeCallback = (resource: PipelineResourceTask) => void;
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
export type TaskListNodeModelData = PipelineRunAfterNodeModelData & {
  clusterTaskList: PipelineResourceTask[];
  namespaceTaskList: PipelineResourceTask[];
  onNewTask: NewTaskNodeCallback;
  onRemoveTask: RemoveListTaskCallback | null;
};
export type BuilderNodeModelData = PipelineRunAfterNodeModelData & {
  error?: string;
  task: PipelineVisualizationTaskItem;
  onAddNode: NewTaskListNodeCallback;
  onNodeSelection: NodeSelectionCallback;
};
export type SpacerNodeModelData = PipelineRunAfterNodeModelData & {};
export type TaskNodeModelData = PipelineRunAfterNodeModelData & {
  task: PipelineVisualizationTaskItem;
  pipeline?: Pipeline;
  pipelineRun?: PipelineRun;
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

export type PipelineEdgeModel = EdgeModel;

// Node Creators
export type NodeCreator<D extends PipelineRunAfterNodeModelData> = (
  name: string,
  data: D,
) => PipelineNodeModel<D>;
export type NodeCreatorSetup = (
  type: NodeType,
  width?: number,
) => NodeCreator<PipelineRunAfterNodeModelData>;
