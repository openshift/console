import * as _ from 'lodash';
import { k8sCreate } from '@console/internal/module/k8s';
import { Pipeline } from 'packages/dev-console/src/utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import { GitImportFormData } from '../import-types';
import { createPipelineResource } from '../../pipelines/pipeline-resource/pipelineResource-utils';

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

  if (template.spec.resources?.find((r) => r.type === 'git' && r.name === 'app-source')) {
    await createGitResource(git.url, namespace, git.ref);
  }
  if (template.spec.resources?.find((r) => r.type === 'image' && r.name === 'app-image')) {
    await createImageResource(name, namespace);
  }

  return k8sCreate(PipelineModel, template, { ns: namespace });
};
