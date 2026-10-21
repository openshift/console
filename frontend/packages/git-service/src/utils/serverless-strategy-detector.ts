import * as _ from 'lodash';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import type { BaseService } from '../services/base-service';

type FuncData = {
  values: {
    builder?: string;
    runtime?: string;
    builderEnvs?: string[];
    runtimeEnvs?: string[];
  };
};

export const evaluateFunc = async (gitService: BaseService): Promise<FuncData> => {
  const isFuncYamlPresent = await gitService.isFuncYamlPresent();

  if (!isFuncYamlPresent) {
    return {
      values: {},
    };
  }

  const resourceContent = await gitService.getFuncYamlContent();

  try {
    const funcJSON = !_.isString(resourceContent) ? resourceContent : safeYAMLToJS(resourceContent);

    const builder = funcJSON?.build?.builder;
    const builderEnvs = funcJSON?.build?.buildEnvs;
    const runtime = funcJSON?.runtime;
    const runtimeEnvs = funcJSON?.run?.envs;
    return {
      values: {
        builder,
        runtime,
        builderEnvs,
        runtimeEnvs,
      },
    };
  } catch {
    return {
      values: {},
    };
  }
};

export const isServerlessFxRepository = async (
  isServerlessEnabled: boolean,
  gitService: BaseService,
): Promise<boolean> => {
  const isFuncYamlPresent = await gitService.isFuncYamlPresent();

  if (isFuncYamlPresent && isServerlessEnabled) {
    const content = await gitService.getFuncYamlContent();
    const funcJSON = safeYAMLToJS(content);
    if (!funcJSON?.build?.builder || funcJSON?.build?.builder === 's2i') {
      return true;
    }
  }
  return false;
};
