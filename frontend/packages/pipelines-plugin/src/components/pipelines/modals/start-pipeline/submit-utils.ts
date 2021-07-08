import { k8sCreate, K8sResourceCommon } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../../models';
import { PipelineKind, PipelineRunKind } from '../../../../types';
import { VolumeTypes } from '../../const';
import {
  createPipelineResource,
  createSecretResource,
} from '../../pipeline-resource/pipelineResource-utils';
import { CREATE_PIPELINE_RESOURCE } from '../common/const';
import { PipelineModalFormResource } from '../common/types';
import { getPipelineRunFromForm } from '../common/utils';
import { StartPipelineFormValues } from './types';

export const resourceSubmit = async (
  resourceValues: PipelineModalFormResource,
  namespace: string,
): Promise<K8sResourceCommon> => {
  const {
    data: { params, secrets, type },
  } = resourceValues;

  return secrets
    ? createSecretResource(secrets, type, namespace).then((secretResp) => {
        return createPipelineResource(params, type, namespace, secretResp);
      })
    : createPipelineResource(params, type, namespace);
};

const processResources = async (
  values: StartPipelineFormValues,
): Promise<StartPipelineFormValues> => {
  const { namespace, resources } = values;

  const toCreateResources: { [index: string]: PipelineModalFormResource } = resources.reduce(
    (acc, resource, index) => {
      return resource.selection === CREATE_PIPELINE_RESOURCE ? { ...acc, [index]: resource } : acc;
    },
    {},
  );
  const createdResources = await Promise.all(
    Object.values(toCreateResources).map((resource) => resourceSubmit(resource, namespace)),
  );
  if (!createdResources || createdResources.length === 0) return values;

  const indexLookup = Object.keys(toCreateResources);
  return {
    ...values,
    resources: resources.map(
      (resource, index): PipelineModalFormResource => {
        if (toCreateResources[index]) {
          const creationIndex = indexLookup.indexOf(index.toString());
          return {
            ...resource,
            selection: createdResources[creationIndex].metadata.name,
          };
        }
        return resource;
      },
    ),
  };
};

const processWorkspaces = (values: StartPipelineFormValues): StartPipelineFormValues => {
  const { workspaces } = values;

  if (!workspaces || workspaces.length === 0) return values;

  return {
    ...values,
    workspaces: workspaces.filter((workspace) => workspace.type !== VolumeTypes.NoWorkspace),
  };
};

export const submitStartPipeline = async (
  values: StartPipelineFormValues,
  pipeline: PipelineKind,
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
): Promise<PipelineRunKind> => {
  let formValues = values;
  formValues = await processResources(formValues);
  formValues = processWorkspaces(formValues);

  const pipelineRunResource: PipelineRunKind = await k8sCreate(
    PipelineRunModel,
    getPipelineRunFromForm(pipeline, formValues, labels, annotations),
  );

  return Promise.resolve(pipelineRunResource);
};
