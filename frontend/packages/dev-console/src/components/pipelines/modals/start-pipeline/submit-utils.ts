import { k8sCreate, K8sResourceCommon } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../../models';
import { Pipeline, PipelineRun } from '../../../../utils/pipeline-augment';
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
    name,
    data: { params, secrets, type },
  } = resourceValues;

  return secrets
    ? createSecretResource(secrets, type, namespace).then((secretResp) => {
        return createPipelineResource(name, namespace, type, secretResp);
      })
    : createPipelineResource(name, namespace, type, params);
};

export const submitStartPipeline = async (
  values: StartPipelineFormValues,
  pipeline: Pipeline,
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
): Promise<PipelineRun> => {
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

  let formValues = values;
  if (createdResources.length > 0) {
    const indexLookup = Object.keys(toCreateResources);
    formValues = {
      ...formValues,
      resources: formValues.resources.map(
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
  }

  const pipelineRunResource: PipelineRun = await k8sCreate(
    PipelineRunModel,
    getPipelineRunFromForm(pipeline, formValues, labels, annotations),
  );

  return Promise.resolve(pipelineRunResource);
};
