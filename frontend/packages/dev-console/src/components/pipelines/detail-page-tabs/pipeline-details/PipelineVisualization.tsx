import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { Pipeline, PipelineRun } from '../../../../utils/pipeline-augment';
import { hasInlineTaskSpec } from '../../../../utils/pipeline-utils';
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
  let content: React.ReactElement;
  if (hasInlineTaskSpec(pipeline)) {
    // TODO: Inline taskSpec is not yet supported feature
    content = (
      <Alert
        variant="info"
        isInline
        title="This Pipeline cannot be visualized. Pipeline taskSpec is not supported."
      />
    );
  } else if (nodes.length === 0 && edges.length === 0) {
    // Nothing to render
    // TODO: Confirm wording with UX; ODC-1860
    content = <Alert variant="info" isInline title="This Pipeline has no tasks to visualize." />;
  } else {
    content = (
      <PipelineTopologyGraph
        id={pipelineRun?.metadata?.name || pipeline.metadata.name}
        nodes={nodes}
        edges={edges}
        layout={PipelineLayout.DAGRE_VIEWER}
      />
    );
  }

  return <div className="odc-pipeline-visualization">{content}</div>;
};

export default PipelineVisualization;
