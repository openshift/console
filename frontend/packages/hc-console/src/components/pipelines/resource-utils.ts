import { get } from 'lodash';
import {
  PipelineResourceTask,
  PipelineResourceTaskParam,
  PipelineResourceTaskResource,
} from '../../utils/pipeline-augment';

type PipelineResourceTaskAlpha = PipelineResourceTask & {
  spec: {
    inputs?: {
      params?: PipelineResourceTaskParam[];
      resources?: PipelineResourceTaskResource[];
    };
    outputs?: {
      resources?: PipelineResourceTaskResource[];
    };
  };
};

export type InputOutputResources = {
  inputs?: PipelineResourceTaskResource[];
  outputs?: PipelineResourceTaskResource[];
};

enum PATHS {
  alphaInputResources = 'spec.inputs.resources',
  alphaOutputResources = 'spec.outputs.resources',
  alphaParameters = 'spec.inputs.params',

  betaInputResources = 'spec.resources.inputs',
  betaOutputResources = 'spec.resources.outputs',
  betaParameters = 'spec.params',
}

export const getTaskResources = (
  taskResource: PipelineResourceTask | PipelineResourceTaskAlpha,
): InputOutputResources => {
  const inputs =
    get(taskResource, PATHS.alphaInputResources) || get(taskResource, PATHS.betaInputResources);
  const outputs =
    get(taskResource, PATHS.alphaOutputResources) || get(taskResource, PATHS.betaOutputResources);

  if (inputs || outputs) {
    return {
      inputs,
      outputs,
    };
  }

  return {};
};

export const getTaskParameters = (
  taskResource: PipelineResourceTask | PipelineResourceTaskAlpha,
): PipelineResourceTaskParam[] => {
  return get(taskResource, PATHS.alphaParameters) || get(taskResource, PATHS.betaParameters) || [];
};
