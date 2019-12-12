import {
  EdgeModel,
  NodeModel,
} from '@console/topology';
import { PipelineVisualizationTaskItem } from '../../../../../utils/pipeline-utils';
import { Pipeline, PipelineRun } from '../../../../../utils/pipeline-augment';

export type PipelineEdgeModel = EdgeModel;

export type PipelineNodeModel = {
  data: {
    task: PipelineVisualizationTaskItem;
    pipeline: Pipeline;
    pipelineRun?: PipelineRun;
  };
} & NodeModel;
