import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import { PipelineKind, PipelineRunKind } from '../../../../types';
import PipelineTopologyGraph from '../../pipeline-topology/PipelineTopologyGraph';
import { getTopologyNodesEdges, hasWhenExpression } from '../../pipeline-topology/utils';
import { PipelineLayout } from '../../pipeline-topology/const';

import './PipelineVisualization.scss';

interface PipelineTopologyVisualizationProps {
  pipeline: PipelineKind;
  pipelineRun?: PipelineRunKind;
}

const PipelineVisualization: React.FC<PipelineTopologyVisualizationProps> = ({
  pipeline,
  pipelineRun,
}) => {
  const { t } = useTranslation();
  let content: React.ReactElement;

  const { nodes, edges } = getTopologyNodesEdges(pipeline, pipelineRun);

  if (nodes.length === 0 && edges.length === 0) {
    // Nothing to render
    // TODO: Confirm wording with UX; ODC-1860
    content = (
      <Alert
        variant="info"
        isInline
        title={t('pipelines-plugin~This Pipeline has no tasks to visualize.')}
      />
    );
  } else {
    content = (
      <PipelineTopologyGraph
        id={`${pipelineRun?.metadata?.name || pipeline.metadata.name}-graph`}
        data-test="pipeline-visualization"
        nodes={nodes}
        edges={edges}
        layout={
          hasWhenExpression(pipeline)
            ? PipelineLayout.DAGRE_VIEWER_SPACED
            : PipelineLayout.DAGRE_VIEWER
        }
      />
    );
  }

  return <div className="odc-pipeline-visualization">{content}</div>;
};

export default PipelineVisualization;
