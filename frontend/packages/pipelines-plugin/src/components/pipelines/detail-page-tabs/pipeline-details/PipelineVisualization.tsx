import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PipelineKind, PipelineRunKind, TaskRunKind } from '../../../../types';
import { dagreViewerComponentFactory } from '../../pipeline-topology/factories';
import PipelineTopologyGraph from '../../pipeline-topology/PipelineTopologyGraph';
import { getGraphDataModel } from '../../pipeline-topology/utils';

import './PipelineVisualization.scss';

interface PipelineTopologyVisualizationProps {
  pipeline: PipelineKind;
  pipelineRun?: PipelineRunKind;
  taskRuns?: TaskRunKind[];
}

const PipelineVisualization: React.FC<PipelineTopologyVisualizationProps> = ({
  pipeline,
  pipelineRun,
  taskRuns,
}) => {
  const { t } = useTranslation();
  let content: React.ReactElement;
  const model = getGraphDataModel(pipeline, pipelineRun, taskRuns);

  if (!model || (model.nodes.length === 0 && model.edges.length === 0)) {
    // Nothing to render
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
        data-test="pipeline-visualization"
        componentFactory={dagreViewerComponentFactory}
        model={model}
        showControlBar
      />
    );
  }

  return <div className="odc-pipeline-visualization">{content}</div>;
};

export default PipelineVisualization;
