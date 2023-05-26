import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils';
import { PipelineKind, PipelineRunKind } from '../../../types';
import PipelineVisualization from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import { useTaskRuns } from '../../taskruns/useTaskRuns';
import { usePipelineFromPipelineRun } from '../hooks/usePipelineFromPipelineRun';
import './PipelineRunVisualization.scss';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({ pipelineRun }) => {
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
  );
  const pipeline: PipelineKind = usePipelineFromPipelineRun(pipelineRun);
  if (!pipeline) {
    return (
      <div className="pipeline-plr-loader">
        <LoadingInline />
      </div>
    );
  }
  return (
    taskRunsLoaded && (
      <PipelineVisualization pipeline={pipeline} pipelineRun={pipelineRun} taskRuns={taskRuns} />
    )
  );
};

export default PipelineRunVisualization;
