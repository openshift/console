import { EdgeModel, NodeModel } from '@console/topology';
import { Pipeline, PipelineRun } from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { NodeType } from './const';

export type PipelineEdgeModel = EdgeModel;

export type PipelineNodeModelData = {
  task: PipelineVisualizationTaskItem;
  pipeline?: Pipeline;
  pipelineRun?: PipelineRun;
};

export type PipelineNodeModel = NodeModel & {
  data: PipelineNodeModelData;
};

export type NodeCreator = (name: string, data: PipelineNodeModelData) => PipelineNodeModel;
export type NodeCreatorSetup = (type: NodeType, width?: number) => NodeCreator;
