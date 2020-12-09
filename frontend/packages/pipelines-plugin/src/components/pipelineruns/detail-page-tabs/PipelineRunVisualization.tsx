import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils';
import PipelineVisualization from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import { PipelineRun, getPipelineFromPipelineRun } from '../../../utils/pipeline-augment';

import './PipelineRunVisualization.scss';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRun;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({ pipelineRun }) => {
  const pipeline = getPipelineFromPipelineRun(pipelineRun);
  if (!pipeline) {
    return (
      <div className="pipeline-plr-loader">
        <LoadingInline />
      </div>
    );
  }
  return <PipelineVisualization pipeline={pipeline} pipelineRun={pipelineRun} />;
};

export default PipelineRunVisualization;
