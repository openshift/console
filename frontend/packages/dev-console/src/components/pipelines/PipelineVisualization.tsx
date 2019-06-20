import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getPipelineTasks } from '../../utils/pipeline-utils';
import { PipelineVisualizationGraph } from './PipelineVisualizationGraph';

export interface PipelineVisualizationProps {
  pipeline?: K8sResourceKind;
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({ pipeline }) => (
  <PipelineVisualizationGraph
    namespace={pipeline.metadata.namespace}
    graph={getPipelineTasks(pipeline)}
  />
);
