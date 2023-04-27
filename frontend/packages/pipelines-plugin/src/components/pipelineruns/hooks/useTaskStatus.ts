import { PipelineKind, PipelineRunKind, TaskRunKind } from '../../../types';
import { getTaskStatus, TaskStatus } from '../../../utils/pipeline-augment';
import { usePipelineFromPipelineRun } from './usePipelineFromPipelineRun';

export const useTaskStatus = (
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
): TaskStatus => {
  const pipeline: PipelineKind = usePipelineFromPipelineRun(pipelineRun);
  return getTaskStatus(pipelineRun, pipeline, taskRuns);
};
