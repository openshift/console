import { get } from 'lodash';
import { TaskKind, TektonParam, TektonResource, TektonResourceGroup } from '../../types';

export type TaskKindAlpha = TaskKind & {
  spec: {
    inputs?: {
      params?: TektonParam[];
      resources?: TektonResource[];
    };
    outputs?: {
      resources?: TektonResource[];
    };
  };
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
  taskResource: TaskKind | TaskKindAlpha,
): TektonResourceGroup<TektonResource> => {
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

export const getTaskParameters = (taskResource: TaskKind | TaskKindAlpha): TektonParam[] => {
  return get(taskResource, PATHS.alphaParameters) || get(taskResource, PATHS.betaParameters) || [];
};
