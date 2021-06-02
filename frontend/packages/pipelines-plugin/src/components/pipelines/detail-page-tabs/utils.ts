import i18next from 'i18next';
import * as _ from 'lodash';
import { PipelineModel, PipelineResourceModel } from '../../../models';
import {
  PipelineKind,
  PipelineRunKind,
  PipelineRunReferenceResource,
  PipelineRunResource,
  PipelineTask,
  TektonParam,
  TektonResource,
} from '../../../types';
import { getSafeTaskResourceKind } from '../../../utils/pipeline-augment';
import PipelineResourceRef from '../../shared/common/PipelineResourceRef';
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
    return tasks?.map((task) =>
      task.taskRef
        ? {
            resourceKind: getSafeTaskResourceKind(task.taskRef.kind),
            name: task.taskRef.name,
            qualifier: task.name,
          }
        : {
            resourceKind: 'EmbeddedTask',
            name: i18next.t('pipelines-plugin~Embedded Task'),
            qualifier: task.name,
          },
    );
  };
  return {
    taskLinks: toResourceLinkData(pipeline.spec.tasks),
    finallyTaskLinks: toResourceLinkData(pipeline.spec.finally),
  };
};

const isResourceRef = (resource: PipelineRunResource): resource is PipelineRunReferenceResource =>
  !!(resource as PipelineRunReferenceResource).resourceRef;

export const getPipelineResourceLinks = (
  definitionResources: TektonResource[] = [],
  runResources: PipelineRunResource[],
): ResourceModelLink[] => {
  return runResources?.map(
    (resource): ResourceModelLink => {
      const definitionResource = definitionResources.find(({ name }) => name === resource.name);
      const qualifier = definitionResource ? definitionResource.type : undefined;

      if (isResourceRef(resource)) {
        return {
          resourceKind: PipelineResourceModel.kind,
          name: resource.resourceRef.name,
          qualifier,
        };
      }

      return {
        resourceKind: 'EmbeddedPipelineResource',
        name: i18next.t('pipelines-plugin~Embedded PipelineResource'),
        qualifier,
      };
    },
  );
};

export const convertBackingPipelineToPipelineResourceRefProps = (
  pipelineRun: PipelineRunKind,
): React.ComponentProps<typeof PipelineResourceRef> => {
  if (pipelineRun.spec.pipelineRef) {
    return {
      resourceKind: PipelineModel.kind,
      resourceName: pipelineRun.spec.pipelineRef.name,
      namespace: pipelineRun.metadata.namespace,
    };
  }

  return {
    resourceKind: 'EmbeddedPipeLine', // intentional capitalization for EPL
    resourceName: i18next.t('pipelines-plugin~Embedded Pipeline'),
  };
};
