import { useFormikContext } from 'formik';
import {
  PipelineBuilderFormikValues,
  SelectedBuilderTask,
} from '../../../pipelines/pipeline-builder/types';
import {
  computeAvailableResultACs,
  paramToAutoComplete,
  taskToStatus,
  workspaceToAutoComplete,
} from './autoCompleteUtils';

export const useBuilderParams = (selectedData: SelectedBuilderTask): string[] => {
  const {
    values: {
      formData: { params, tasks, workspaces },
      taskResources,
    },
  } = useFormikContext<PipelineBuilderFormikValues>();
  const { taskIndex, isFinallyTask } = selectedData || {};

  const paramACs: string[] = params.map(paramToAutoComplete);
  const workspaceACs: string[] = workspaces.map(workspaceToAutoComplete);

  const contextualACs: string[] = [
    'context.pipelineRun.name',
    'context.pipelineRun.namespace',
    'context.pipelineRun.uid',
    'context.pipeline.name',
  ];

  let finallyStatusACs: string[] = [];
  if (isFinallyTask) {
    finallyStatusACs = tasks.map(taskToStatus);
  }

  const taskResultACs: string[] = computeAvailableResultACs(tasks, taskResources, taskIndex);

  return [...paramACs, ...workspaceACs, ...contextualACs, ...finallyStatusACs, ...taskResultACs];
};
