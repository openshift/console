import * as _ from 'lodash';
import { k8sCreate } from '@console/internal/module/k8s';
import { Pipeline, PipelineRun } from 'packages/dev-console/src/utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import { GitImportFormData } from '../import-types';
import { createPipelineResource } from '../../pipelines/pipeline-resource/pipelineResource-utils';
import { convertPipelineToModalData } from '../../pipelines/modals/common/utils';
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

export const createPipelineForImportFlow = async (formData: GitImportFormData) => {
  const {
    name,
    project: { name: namespace },
    git,
    pipeline,
    docker: { dockerfilePath },
  } = formData;
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
        return { ...param, default: git.url };
      case 'GIT_REVISION':
        return { ...param, default: git.ref || 'master' };
      case 'PATH_CONTEXT':
        return { ...param, default: git.dir.replace(/^\//, '') || param.default };
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

export const createPipelineRunForImportFlow = async (
  formData: GitImportFormData,
  pipeline: Pipeline,
): Promise<PipelineRun> => {
  const pipelineInitialValues: StartPipelineFormValues = {
    ...convertPipelineToModalData(pipeline),
    secretOpen: false,
  };
  return submitStartPipeline(pipelineInitialValues, pipeline);
};
