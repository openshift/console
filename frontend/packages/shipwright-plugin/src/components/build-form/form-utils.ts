import type { IBuild } from '@kubernetes-models/shipwright/shipwright.io/v1beta1/Build';
import * as _ from 'lodash';
import { safeJSToYAML, safeYAMLToJS } from '@console/shared/src/utils/yaml';
import type { Build, BuildRun } from '../../types';
import { getInitialBuildFormikValues } from './initial-data';
import type { BuildFormikValues } from './types';

// utils to convert yaml to formData
const convertBuildNameToFormData = (build: Build, values: BuildFormikValues) => {
  values.formData.name = build.metadata.name || '';
};

const convertBuildSourceToFormData = (
  build: IBuild & { latestBuild?: BuildRun },
  values: BuildFormikValues,
) => {
  values.formData.source.git.project.name = build.metadata.namespace;
  values.formData.source.type = 'Git';
  values.formData.source.git.git.url = build.spec.source?.git?.url || '';
  values.formData.source.git.git.ref = build.spec.source?.git?.revision || '';
  values.formData.source.git.git.dir = build.spec.source?.contextDir || '';
  values.formData.source.git.git.secret = build.spec.source?.git?.cloneSecret || '';
};

const convertBuildStrategyToFormData = (build: Build, values: BuildFormikValues) => {
  values.formData.build.strategy = build.spec.strategy.name;
  values.formData.build.kind = build.spec.strategy.kind;
};

const convertBuildParamsToFormData = (build: Build, values) => {
  const params = build.spec?.paramValues?.map((paramValue) => {
    return {
      name: paramValue.name,
      ...(paramValue.value
        ? { value: paramValue.value }
        : { value: paramValue?.values?.map((val) => val.value) }),
      ...(paramValue.value ? { default: paramValue.value } : {}),
      type: paramValue.values ? 'array' : 'string',
    };
  });
  values.formData.parameters = params || [];
};

const convertBuildOutputToFormData = (
  build: IBuild & { latestBuild?: BuildRun },
  values: BuildFormikValues,
) => {
  values.formData.outputImage.image = build.spec.output.image;
  if (build.spec.output.pushSecret) {
    values.formData.outputImage.secret = build.spec.output.pushSecret;
  } else {
    values.formData.outputImage.secret = '';
  }
};

const convertBuildVolumesToFormData = (build, values) => {
  const volumes = (build.spec?.volumes || []).map((volume) => {
    const keys = Object.keys(volume);
    const volumeKey = _.without(keys, 'name', 'overridable', 'description');
    return {
      name: volume.name,
      resourceType: volumeKey[0],
      resource: volumeKey[0] === 'emptyDir' ? volume[volumeKey[0]] : volume[volumeKey[0]].name,
      overridable: true,
      description: volume.description,
    };
  });
  values.formData.volumes = volumes;
};

const convertBuildEnvsToFormData = (build: IBuild & { latestBuild?: BuildRun }, values) => {
  values.formData.environmentVariables = build.spec.env || [];
};

export const convertBuildToFormData = (
  build: Build,
  originValues = getInitialBuildFormikValues(),
): any => {
  const values: BuildFormikValues = _.cloneDeep(originValues);

  const safeBuild: Build = {
    apiVersion: 'shipwright.io/v1beta1',
    kind: 'Build',
    metadata: build?.metadata && typeof build.metadata === 'object' ? build.metadata : {},
    spec:
      build?.spec && typeof build.spec === 'object'
        ? build.spec
        : {
            output: {
              image: '',
            },
            source: {},
            strategy: {
              name: '',
              kind: '',
            },
          },
  };
  convertBuildNameToFormData(safeBuild, values);
  convertBuildSourceToFormData(safeBuild, values);
  convertBuildStrategyToFormData(safeBuild, values);
  convertBuildParamsToFormData(safeBuild, values);
  convertBuildOutputToFormData(safeBuild, values);
  convertBuildVolumesToFormData(safeBuild, values);
  convertBuildEnvsToFormData(safeBuild, values);

  return values;
};

// utils to convert formData to yaml
const convertFormDataNameToBuild = (values: BuildFormikValues, build: Build) => {
  build.metadata.name = values.formData.name;
};

const convertFormDataSourceToBuild = (values: BuildFormikValues, build: Build) => {
  const { git } = values.formData.source.git;
  build.spec.source = {
    ...build.spec.source,
    type: 'Git',
    contextDir: git.dir,
    git: {
      url: git.url,
      ...(git.ref ? { revision: git.ref } : {}),
      ...(git.secret ? { cloneSecret: git.secret } : {}),
    },
  };
};

const convertFormDataStrategyToBuild = (values: BuildFormikValues, build: Build) => {
  const buildStrategy = values.formData.build;
  build.spec.strategy = {
    ...build.spec.strategy,
    name: buildStrategy.strategy,
    kind: buildStrategy?.kind,
  };
};

const convertFormDataOutputToBuild = (values: BuildFormikValues, build: Build) => {
  const { outputImage } = values.formData;
  build.spec.output = {
    ...build.spec.output,
    image: outputImage.image,
    ...(outputImage.secret ? { pushSecret: outputImage.secret } : {}),
  };
};

const convertFromDataVolumesToBuild = (values: BuildFormikValues, build: Build) => {
  const { volumes } = values.formData;
  const buildVolumes = volumes.map((volume) => {
    return (
      volume.overridable && {
        name: volume.name,
        ...(volume.resourceType === 'emptyDir'
          ? {
              [volume.resourceType]: {},
            }
          : {
              [volume.resourceType]: {
                name: volume.resource,
              },
            }),
      }
    );
  });
  build.spec.volumes = buildVolumes;
};

const convertFormDataParamsToBuild = (values, build: Build) => {
  const { parameters } = values.formData;
  const paramValues = parameters?.map((param) => {
    return {
      name: param.name,
      ...(param.type === 'string'
        ? { value: param.value }
        : {
            values:
              param.value.length > 0
                ? param.value?.map((val) => ({
                    value: val,
                  }))
                : [],
          }),
    };
  });

  build.spec.paramValues = paramValues || [];
};

const convertFormDataEnvsToBuild = (values: BuildFormikValues, build: Build) => {
  const { environmentVariables } = values.formData;
  build.spec.env = environmentVariables;
};

export const convertFormDataToBuild = (originalBuild: Build, values: BuildFormikValues): Build => {
  let build = _.cloneDeep(originalBuild);
  if (!build || typeof build !== 'object') {
    build = {
      apiVersion: 'shipwright.io/v1beta1',
      kind: 'Build',
      metadata: {},
      spec: {
        output: {
          image: '',
        },
        source: {},
        strategy: {
          name: '',
          kind: '',
        },
      },
    };
  }

  if (!build.apiVersion) build.apiVersion = 'shipwright.io/v1beta1';
  if (!build.kind) build.kind = 'Build';
  if (!build.metadata || typeof build.metadata !== 'object') build.metadata = {};
  if (!build.spec || typeof build.spec !== 'object') {
    build.spec = {
      output: {
        image: '',
      },
      source: {},
      strategy: {
        name: '',
        kind: '',
      },
    };
  }

  // Convert all sections
  convertFormDataNameToBuild(values, build);
  convertFormDataSourceToBuild(values, build);
  convertFormDataStrategyToBuild(values, build);
  convertFormDataOutputToBuild(values, build);
  convertFromDataVolumesToBuild(values, build);
  convertFormDataParamsToBuild(values, build);
  convertFormDataEnvsToBuild(values, build);

  return build;
};

export const convertBuildFormDataToYAML = (values): string => {
  const parsedBuild = safeYAMLToJS(values.yamlData);
  const updatedBuild = convertFormDataToBuild(parsedBuild, values);
  return safeJSToYAML(updatedBuild, '', { skipInvalid: true });
};
