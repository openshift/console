import i18next from 'i18next';
import * as _ from 'lodash';
import { groupVersionFor } from '@console/internal/module/k8s';
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

export const sanitizePipelineParams = (parameters: TektonParam[]): TektonParam[] => {
  const pipelineWithNoEmptyDefaultParams = removeEmptyDefaultFromPipelineParams(parameters);
  return pipelineWithNoEmptyDefaultParams.length > 0
    ? pipelineWithNoEmptyDefaultParams.map((parameter) => {
        if (parameter?.type === 'array' && typeof parameter?.default === 'string') {
          return {
            ...parameter,
            default: parameter.default.split(',').map((param) => param.trim()),
          };
        }
        return parameter;
      })
    : [];
};

type PipelineTaskLinks = {
  taskLinks: ResourceModelLink[];
  finallyTaskLinks: ResourceModelLink[];
};

export const getPipelineTaskLinks = (pipeline: PipelineKind): PipelineTaskLinks => {
  const toResourceLinkData = (tasks: PipelineTask[]): ResourceModelLink[] => {
    if (!tasks) return [];
    const { version } = groupVersionFor(pipeline.apiVersion);
    return tasks?.map((task) =>
      task.taskRef
        ? task.taskRef.kind === 'ClusterTask' || task.taskRef.kind === 'Task'
          ? {
              resourceKind: getSafeTaskResourceKind(task.taskRef.kind),
              name: task.taskRef.name,
              qualifier: task.name,
              resourceApiVersion: version,
            }
          : {
              resourceKind: task.taskRef?.kind,
              name: i18next.t('pipelines-plugin~Custom Task'),
              qualifier: task.name,
              disableLink: true,
            }
        : {
            resourceKind: 'EmbeddedTask',
            name: i18next.t('pipelines-plugin~Embedded task'),
            qualifier: task.name,
            disableLink: true,
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
    const { version } = groupVersionFor(pipelineRun.apiVersion);
    return {
      resourceKind: PipelineModel.kind,
      resourceName: pipelineRun.spec.pipelineRef.name,
      namespace: pipelineRun.metadata.namespace,
      resourceApiVersion: version,
    };
  }

  return {
    resourceKind: 'EmbeddedPipeLine', // intentional capitalization for EPL
    resourceName: i18next.t('pipelines-plugin~Embedded Pipeline'),
  };
};
