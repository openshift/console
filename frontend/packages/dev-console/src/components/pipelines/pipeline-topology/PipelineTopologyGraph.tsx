import * as React from 'react';
import { ModelKind } from '@patternfly/react-topology';
import PipelineVisualizationSurface from './PipelineVisualizationSurface';
import { PipelineLayout } from './const';
import { PipelineEdgeModel, PipelineMixedNodeModel } from './types';

import './PipelineTopologyGraph.scss';

type PipelineTopologyGraphProps = {
  id: string;
  fluid?: boolean;
  nodes: PipelineMixedNodeModel[];
  edges: PipelineEdgeModel[];
  layout: PipelineLayout;
};

const PipelineTopologyGraph: React.FC<PipelineTopologyGraphProps> = ({
  id,
  fluid,
  nodes,
  edges,
  layout,
}) => {
  return (
    <div className="odc-pipeline-topology-graph" style={{ display: fluid ? 'block' : undefined }}>
      <PipelineVisualizationSurface
        model={{
          graph: {
            id,
            type: ModelKind.graph,
            layout,
          },
          nodes,
          edges,
        }}
      />
    </div>
  );
};

export default PipelineTopologyGraph;
