import * as React from 'react';
import { ModelKind } from '@console/topology';
import PipelineVisualizationSurface from './PipelineVisualizationSurface';
import { PipelineLayout } from './const';
import { PipelineEdgeModel, PipelineNodeModel } from './types';

import './PipelineTopologyGraph.scss';

type PipelineTopologyGraphProps = {
  id: string;
  nodes: PipelineNodeModel[];
  edges: PipelineEdgeModel[];
};

const PipelineTopologyGraph: React.FC<PipelineTopologyGraphProps> = ({ id, nodes, edges }) => {
  return (
    <div className="odc-pipeline-topology-visualization">
      <PipelineVisualizationSurface
        model={{
          graph: {
            id,
            type: ModelKind.graph,
            layout: PipelineLayout.DAGRE,
          },
          nodes,
          edges,
        }}
      />
    </div>
  );
};

export default PipelineTopologyGraph;
