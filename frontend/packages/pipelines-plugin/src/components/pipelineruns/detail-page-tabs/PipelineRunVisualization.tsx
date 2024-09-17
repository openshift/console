import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { PipelineKind, PipelineRunKind } from '../../../types';
import { FLAG_PIPELINES_OPERATOR_VERSION_1_16 } from '../../pipelines/const';
import PipelineVisualization from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import { usePipelineFromPipelineRun } from '../hooks/usePipelineFromPipelineRun';
import { useTaskRuns } from '../hooks/useTaskRuns';
import './PipelineRunVisualization.scss';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({ pipelineRun }) => {
  const IS_PIPELINE_OPERATOR_VERSION_1_16 = useFlag(FLAG_PIPELINES_OPERATOR_VERSION_1_16);
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
    undefined,
    undefined,
    IS_PIPELINE_OPERATOR_VERSION_1_16,
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
