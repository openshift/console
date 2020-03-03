import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { Pipeline, PipelineRun } from '../../../../utils/pipeline-augment';
import PipelineTopologyGraph from '../../pipeline-topology/PipelineTopologyGraph';
import { getTopologyNodesEdges } from '../../pipeline-topology/utils';
import { PipelineLayout } from '../../pipeline-topology/const';

import './PipelineVisualization.scss';

interface PipelineTopologyVisualizationProps {
  pipeline: Pipeline;
  pipelineRun?: PipelineRun;
}

const PipelineVisualization: React.FC<PipelineTopologyVisualizationProps> = ({
  pipeline,
  pipelineRun,
}) => {
  const { nodes, edges } = getTopologyNodesEdges(pipeline, pipelineRun);

  if (nodes.length === 0 && edges.length === 0) {
    // Nothing to render
    // TODO: Confirm wording with UX; ODC-1860
    return <Alert variant="info" isInline title="This Pipeline has no tasks to visualize." />;
  }

  return (
    <div className="odc-pipeline-visualization">
      <PipelineTopologyGraph
        id={pipelineRun?.metadata?.name || pipeline.metadata.name}
        nodes={nodes}
        edges={edges}
        layout={PipelineLayout.DAGRE_VIEWER}
      />
    </div>
  );
};

export default PipelineVisualization;
