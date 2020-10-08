import * as _ from 'lodash';
import { k8sCreate } from '@console/internal/module/k8s';
import { Pipeline } from 'packages/dev-console/src/utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import { GitData, GitImportFormData } from '../import-types';
import { createPipelineResource } from '../../pipelines/pipeline-resource/pipelineResource-utils';
import { convertPipelineToModalData } from '../../pipelines/modals/common/utils';
import { submitStartPipeline } from '../../pipelines/modals/start-pipeline/submit-utils';
import { PipelineResourceType } from '../../pipelines/const';

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

const getResourceParams = (
  restype: string,
  resName: string,
  name: string,
  namespace: string,
  git: GitData,
) => {
  let resParams = {};
  if (restype === PipelineResourceType.git && resName === 'app-source') {
    resParams = {
      params: {
        url: git.url,
        revision: git.ref || 'master',
      },
    };
  } else if (restype === PipelineResourceType.image && resName === 'app-image') {
    resParams = {
      params: {
        url: getImageUrl(name, namespace),
      },
    };
  }
  return resParams;
};

export const createPipelineForImportFlow = async (formData: GitImportFormData) => {
  const {
    name,
    project: { name: namespace },
    git,
    pipeline,
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
      default:
        return param;
    }
  });

  return k8sCreate(PipelineModel, template, { ns: namespace });
};

export const createPipelineRunForImportFlow = async (formData: GitImportFormData) => {
  const {
    name,
    project: { name: namespace },
    git,
  } = formData;
  const pipeline = await createPipelineForImportFlow(formData);
  if (pipeline) {
    const pipelineInitialValues = {
      ...convertPipelineToModalData(pipeline, true),
      secretOpen: false,
    };
    pipelineInitialValues.resources = (pipelineInitialValues.resources || []).map((r) => ({
      ...r,
      data: {
        ...r.data,
        ...getResourceParams(r.data.type, r.name, name, namespace, git),
      },
    }));
    return submitStartPipeline(pipelineInitialValues, pipeline);
  }
  return undefined;
};
