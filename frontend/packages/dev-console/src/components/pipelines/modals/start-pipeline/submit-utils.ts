import { k8sCreate, K8sResourceCommon, SecretKind } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { associateServiceAccountToSecrets } from '../../../../utils/pipeline-utils';
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
    data: { params, secrets, type },
  } = resourceValues;

  return secrets
    ? createSecretResource(secrets, type, namespace).then((secretResp) => {
        return createPipelineResource(params, type, namespace, secretResp);
      })
    : createPipelineResource(params, type, namespace);
};

export const createResources = async (
  namespace: string,
  values: StartPipelineFormValues,
  resources: PipelineModalFormResource[],
): Promise<StartPipelineFormValues> => {
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
  return formValues;
};

export const createSecrets = async (secrets: SecretKind[], namespace: string) => {
  const createdSecrets: SecretKind[] = await Promise.all(
    secrets.map((secret: SecretKind) => k8sCreate(SecretModel, secret)),
  );
  associateServiceAccountToSecrets(createdSecrets, namespace);
};

export const submitStartPipeline = async (
  values: StartPipelineFormValues,
  pipeline: Pipeline,
  labels: { [key: string]: string },
): Promise<PipelineRun> => {
  const { namespace, resources, newSecrets } = values;

  const formValues = await createResources(namespace, values, resources);
  await createSecrets(newSecrets, values.namespace);

  return k8sCreate(PipelineRunModel, getPipelineRunFromForm(pipeline, formValues, labels));
};
