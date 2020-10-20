import * as React from 'react';
import PipelineVisualization from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import { PipelineRun, getPipelineFromPipelineRun } from '../../../utils/pipeline-augment';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRun;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({ pipelineRun }) => (
  <PipelineVisualization
    pipeline={getPipelineFromPipelineRun(pipelineRun)}
    pipelineRun={pipelineRun}
  />
);

export default PipelineRunVisualization;
