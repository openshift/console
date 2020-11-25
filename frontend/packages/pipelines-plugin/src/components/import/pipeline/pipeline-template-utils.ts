import * as _ from 'lodash';
import { k8sCreate } from '@console/internal/module/k8s';
import { PipelineData } from '../import-types';
import { Pipeline, PipelineRun, PipelineWorkspace } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import { createPipelineResource } from '../../pipelines/pipeline-resource/pipelineResource-utils';
import {
  convertPipelineToModalData,
  getDefaultVolumeClaimTemplate,
} from '../../pipelines/modals/common/utils';
import { submitStartPipeline } from '../../pipelines/modals/start-pipeline/submit-utils';
import { StartPipelineFormValues } from '../../pipelines/modals/start-pipeline/types';

const getImageUrl = (name: string, namespace: string) => {
  return `image-registry.openshift-image-registry.svc:5000/${namespace}/${name}`;
};

export const createGitResource = (url: string, namespace: string, ref: string = 'master') => {
  const params = { url, revision: ref };
  return createPipelineResource(params, 'git', namespace);
};

export const createImageResource = (name: string, namespace: string) => {
  const params = {
    url: getImageUrl(name, namespace),
  };

  return createPipelineResource(params, 'image', namespace);
};

export const createPipelineForImportFlow = async (
  name: string,
  namespace: string,
  gitUrl,
  gitRef,
  gitDir,
  pipeline: PipelineData,
  dockerfilePath: string,
) => {
  const template = _.cloneDeep(pipeline.template) as Pipeline;

  template.metadata = {
    name: `${name}`,
    namespace,
    labels: { ...template.metadata?.labels, 'app.kubernetes.io/instance': name },
  };

  template.spec.params = template.spec.params?.map((param) => {
    switch (param.name) {
      case 'APP_NAME':
        return { ...param, default: name };
      case 'GIT_REPO':
        return { ...param, default: gitUrl };
      case 'GIT_REVISION':
        return { ...param, default: gitRef || 'master' };
      case 'PATH_CONTEXT':
        return { ...param, default: gitDir.replace(/^\//, '') || param.default };
      case 'IMAGE_NAME':
        return { ...param, default: getImageUrl(name, namespace) };
      case 'DOCKERFILE':
        return { ...param, default: dockerfilePath };
      default:
        return param;
    }
  });

  return k8sCreate(PipelineModel, template, { ns: namespace });
};

export const createPipelineRunForImportFlow = async (pipeline: Pipeline): Promise<PipelineRun> => {
  const pipelineInitialValues: StartPipelineFormValues = {
    ...convertPipelineToModalData(pipeline),
    workspaces: (pipeline.spec.workspaces || []).map((workspace: PipelineWorkspace) => ({
      ...workspace,
      type: 'volumeClaimTemplate',
      data: getDefaultVolumeClaimTemplate(pipeline?.metadata?.name),
    })),
    secretOpen: false,
  };
  return submitStartPipeline(pipelineInitialValues, pipeline);
};
