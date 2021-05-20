import { PipelineKind, PipelineRunKind } from '../../../types';
import { getTaskStatus, TaskStatus } from '../../../utils/pipeline-augment';
import { usePipelineFromPipelineRun } from './usePipelineFromPipelineRun';

export const useTaskStatus = (pipelineRun: PipelineRunKind): TaskStatus => {
  const pipeline: PipelineKind = usePipelineFromPipelineRun(pipelineRun);
  return getTaskStatus(pipelineRun, pipeline);
};
