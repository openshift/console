import * as _ from 'lodash';
import { getResourceModelFromTaskKind } from '../../../utils/pipeline-augment';
import { PipelineKind, PipelineTask, TektonParam } from '../../../types';
import { ResourceModelLink } from '../resource-overview/DynamicResourceLinkList';

export const removeEmptyDefaultFromPipelineParams = (parameters: TektonParam[]): TektonParam[] =>
  _.map(
    parameters,
    (parameter) =>
      _.omit(parameter, _.isEmpty(parameter.default) ? ['default'] : []) as TektonParam,
  );

type PipelineTaskLinks = {
  taskLinks: ResourceModelLink[];
  finallyTaskLinks: ResourceModelLink[];
};

export const getPipelineTaskLinks = (pipeline: PipelineKind): PipelineTaskLinks => {
  const toResourceLinkData = (tasks: PipelineTask[]): ResourceModelLink[] => {
    if (!tasks) return [];
    return tasks
      ?.filter((pipelineTask) => !!pipelineTask.taskRef)
      ?.map((task) => ({
        model: getResourceModelFromTaskKind(task.taskRef.kind),
        name: task.taskRef.name,
        displayName: task.name,
      }));
  };
  return {
    taskLinks: toResourceLinkData(pipeline.spec.tasks),
    finallyTaskLinks: toResourceLinkData(pipeline.spec.finally),
  };
};
