import * as _ from 'lodash';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import {
  PIPELINE_RUNTIME_LABEL,
  PIPELINE_RUNTIME_VERSION_LABEL,
  PIPELINE_STRATEGY_LABEL,
} from '../../../const';
import { PipelineModel } from '../../../models';
import { PipelineKind, PipelineRunKind, TektonParam, TektonWorkspace } from '../../../types';
import { VolumeTypes } from '../../pipelines/const';
import {
  convertPipelineToModalData,
  getDefaultVolumeClaimTemplate,
} from '../../pipelines/modals/common/utils';
import { submitStartPipeline } from '../../pipelines/modals/start-pipeline/submit-utils';
import { StartPipelineFormValues } from '../../pipelines/modals/start-pipeline/types';
import { createPipelineResource } from '../../pipelines/pipeline-resource/pipelineResource-utils';
import { PipelineData } from '../import-types';

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

export const getPipelineParams = (
  params: TektonParam[],
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  dockerfilePath: string,
  tag: string,
) => {
  return params.map((param) => {
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
      case 'VERSION':
        return { ...param, default: tag || param.default };
      default:
        return param;
    }
  });
};

export const pipelineRuntimeOrVersionChanged = (
  template: PipelineKind,
  pipeline: PipelineKind,
): boolean =>
  template.metadata?.labels[PIPELINE_RUNTIME_LABEL] !==
    pipeline.metadata?.labels[PIPELINE_RUNTIME_LABEL] ||
  template.metadata?.labels[PIPELINE_RUNTIME_VERSION_LABEL] !==
    pipeline.metadata?.labels[PIPELINE_RUNTIME_VERSION_LABEL];

export const isDockerPipeline = (template: PipelineKind): boolean =>
  template?.metadata?.labels?.[PIPELINE_STRATEGY_LABEL] === 'docker';

export const createPipelineForImportFlow = async (
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  pipeline: PipelineData,
  dockerfilePath: string,
  tag: string,
) => {
  const template = _.cloneDeep(pipeline.template);

  template.metadata = {
    name: `${name}`,
    namespace,
    labels: {
      ...template.metadata?.labels,
      'app.kubernetes.io/instance': name,
      'app.kubernetes.io/name': name,
      ...(!isDockerPipeline(template) && {
        [PIPELINE_RUNTIME_VERSION_LABEL]: tag,
      }),
    },
  };

  template.spec.params =
    template.spec.params &&
    getPipelineParams(
      template.spec.params,
      name,
      namespace,
      gitUrl,
      gitRef,
      gitDir,
      dockerfilePath,
      tag,
    );

  return k8sCreate(PipelineModel, template, { ns: namespace });
};

export const createPipelineRunForImportFlow = async (
  pipeline: PipelineKind,
): Promise<PipelineRunKind> => {
  const pipelineInitialValues: StartPipelineFormValues = {
    ...convertPipelineToModalData(pipeline),
    workspaces: (pipeline.spec.workspaces || []).map((workspace: TektonWorkspace) => ({
      ...workspace,
      type: VolumeTypes.VolumeClaimTemplate,
      data: getDefaultVolumeClaimTemplate(pipeline?.metadata?.name),
    })),
    secretOpen: false,
  };
  return submitStartPipeline(pipelineInitialValues, pipeline);
};
export const updatePipelineForImportFlow = async (
  pipeline: PipelineKind,
  template: PipelineKind,
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  dockerfilePath: string,
  tag: string,
): Promise<PipelineKind> => {
  let updatedPipeline = _.cloneDeep(pipeline);

  if (!template) {
    updatedPipeline.metadata.labels = _.omit(
      updatedPipeline.metadata.labels,
      'app.kubernetes.io/instance',
    );
  } else {
    if (pipelineRuntimeOrVersionChanged(template, pipeline)) {
      updatedPipeline = _.cloneDeep(template);
      updatedPipeline.metadata = {
        resourceVersion: pipeline.metadata.resourceVersion,
        name: `${name}`,
        namespace,
        labels: {
          ...template.metadata?.labels,
          'app.kubernetes.io/instance': name,
          'app.kubernetes.io/name': name,
          ...(!isDockerPipeline(template) && { [PIPELINE_RUNTIME_VERSION_LABEL]: tag }),
        },
      };
    }

    updatedPipeline.spec.params = getPipelineParams(
      template.spec.params,
      name,
      namespace,
      gitUrl,
      gitRef,
      gitDir,
      dockerfilePath,
      tag,
    );
  }
  return k8sUpdate(PipelineModel, updatedPipeline, namespace, name);
};
