import type { FC, ReactElement } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { TaskRunKind } from '@console/shipwright-plugin/src/types';
import type { PipelineKind, PipelineRunKind } from '../../types/pipeline';
import PipelineTopologyGraph from './PipelineTopologyGraph';
import { dagreViewerComponentFactory, getGraphDataModel } from './utils';

import './PipelineVisualization.scss';

interface PipelineTopologyVisualizationProps {
  pipeline: PipelineKind;
  pipelineRun?: PipelineRunKind;
  taskRuns?: TaskRunKind[];
}

const PipelineVisualization: FC<PipelineTopologyVisualizationProps> = ({
  pipeline,
  pipelineRun,
  taskRuns,
}) => {
  const { t } = useTranslation();
  let content: ReactElement;
  const model = getGraphDataModel(pipeline, pipelineRun, taskRuns || []);

  if (!model || (model.nodes.length === 0 && model.edges.length === 0)) {
    // Nothing to render
    content = (
      <Alert
        variant="info"
        isInline
        title={t('devconsole~This Pipeline has no tasks to visualize.')}
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
