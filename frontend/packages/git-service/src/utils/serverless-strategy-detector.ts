import { FuncBuilderTypes } from '@console/dev-console/src/components/import/import-types';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { BaseService } from '../services/base-service';

type FuncData = {
  isBuilderS2I: boolean;
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
      isBuilderS2I: false,
      values: {},
    };
  }

  const resourceContent = await gitService.getFuncYamlContent();

  try {
    const funcJSON = safeYAMLToJS(resourceContent);

    const isBuilderS2I = funcJSON?.build?.builder === FuncBuilderTypes.s2i;
    const builder = funcJSON?.build?.builder;
    const builderEnvs = funcJSON?.build?.buildEnvs;
    const runtime = funcJSON?.runtime;
    const runtimeEnvs = funcJSON?.run?.envs;

    return { isBuilderS2I, values: { builder, runtime, builderEnvs, runtimeEnvs } };
  } catch {
    return {
      isBuilderS2I: false,
      values: {},
    };
  }
};
