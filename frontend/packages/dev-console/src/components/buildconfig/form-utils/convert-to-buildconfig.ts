import * as _ from 'lodash';
import { safeYAMLToJS, safeJSToYAML } from '@console/shared/src/utils/yaml';
import { ImageOptionFormData } from '../sections/ImagesSection';
import { BuildConfig, BuildConfigTrigger, ImageReference } from '../types';
import { BuildConfigFormikValues } from './types';

const deleteKeys = (object: Record<string, any>, ...keys: string[]) => {
  keys.forEach((key) => delete object[key]);
};

const convertFormDataNameToBuildConfig = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  buildConfig.metadata.name = values.formData.name;
};

const convertFormDataToBuildConfigSource = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  switch (values.formData.source.type) {
    case 'git': {
      const { git } = values.formData.source.git;
      buildConfig.spec.source = {
        ...buildConfig.spec.source,
        type: 'Git',
        git: git.ref
          ? {
              uri: git.url,
              ref: git.ref,
            }
          : {
              uri: git.url,
            },
        contextDir: git.dir,
      };
      if (git.secret) {
        buildConfig.spec.source.sourceSecret = { name: git.secret };
      } else {
        delete buildConfig.spec.source.sourceSecret;
      }
      deleteKeys(buildConfig.spec.source, 'dockerfile');

      // Set default 'Source' strategy if no strategy is defined yet.
      if (!buildConfig.spec.strategy?.type) {
        buildConfig.spec.strategy = {
          type: values.formData.images.strategyType || 'Source',
          ...buildConfig.spec.strategy,
        };
      }

      // Updates both app.openshift.io/vcs-* annotations only if the url exists
      // so that we set the branch also if it was not defined earlier.
      if (buildConfig.metadata.annotations?.['app.openshift.io/vcs-uri']) {
        buildConfig.metadata.annotations['app.openshift.io/vcs-uri'] = git.url;
        if (git.ref) {
          buildConfig.metadata.annotations['app.openshift.io/vcs-ref'] = git.ref;
        } else {
          delete buildConfig.metadata.annotations['app.openshift.io/vcs-ref'];
        }
      }

      break;
    }
    case 'dockerfile': {
      buildConfig.spec.source = {
        ...buildConfig.spec.source,
        type: 'Dockerfile',
        dockerfile: values.formData.source.dockerfile,
      };
      deleteKeys(buildConfig.spec.source, 'git');

      // Set default 'Docker' strategy if no strategy is defined yet.
      if (!buildConfig.spec.strategy?.type) {
        buildConfig.spec.strategy = {
          type: values.formData.images.strategyType || 'Docker',
          ...buildConfig.spec.strategy,
        };
      }
      break;
    }
    case 'binary': {
      buildConfig.spec.source = {
        ...buildConfig.spec.source,
        type: 'Binary',
      };

      // Set default 'Source' strategy if no strategy is defined yet.
      if (!buildConfig.spec.strategy?.type) {
        buildConfig.spec.strategy = {
          type: values.formData.images.strategyType || 'Source',
          ...buildConfig.spec.strategy,
        };
      }
      break;
    }
    default:
    // nothing
  }
};

const convertImageOptionFormDataToImageReference = (
  imageOptionFormData: ImageOptionFormData,
  buildConfigNamespace: string,
): ImageReference => {
  if (imageOptionFormData.type === 'imageStreamTag') {
    const { namespace, image = '', tag } = imageOptionFormData.imageStreamTag.imageStream;
    const name = tag ? `${image}:${tag}` : image;
    return namespace === buildConfigNamespace
      ? {
          kind: 'ImageStreamTag',
          name,
        }
      : {
          kind: 'ImageStreamTag',
          namespace,
          name,
        };
  }
  if (imageOptionFormData.type === 'imageStreamImage') {
    const image = imageOptionFormData.imageStreamImage;
    const namespace = image.includes('/')
      ? image.substring(0, image.indexOf('/'))
      : buildConfigNamespace;
    const name = image.includes('/') ? image.substring(image.indexOf('/') + 1) : image;
    return {
      kind: 'ImageStreamImage',
      namespace,
      name,
    };
  }
  if (imageOptionFormData.type === 'dockerImage') {
    return {
      kind: 'DockerImage',
      name: imageOptionFormData.dockerImage,
    };
  }
  return null;
};

const convertFormDataImagesToBuildConfig = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  // Build from => Strategy
  const from = convertImageOptionFormDataToImageReference(
    values.formData.images.buildFrom,
    buildConfig.metadata.namespace,
  );

  // The strategy object is automatically created in convertFormDataToBuildConfigSource
  // if the source type is known. Fallback to Source strategy here if an image is selected
  // without any information about the strategy type.
  if (from && !buildConfig.spec.strategy?.type) {
    buildConfig.spec.strategy = {
      type: values.formData.images.strategyType || 'Source',
      ...buildConfig.spec.strategy,
    };
  }

  const strategyKey = `${buildConfig.spec.strategy?.type?.toLowerCase()}Strategy`;
  if (from && !buildConfig.spec.strategy?.[strategyKey]) {
    buildConfig.spec.strategy[strategyKey] = { from };
  } else if (from) {
    buildConfig.spec.strategy[strategyKey].from = from;
  } else if (buildConfig.spec.strategy?.[strategyKey]) {
    delete buildConfig.spec.strategy[strategyKey].from;
  }

  // Push to => Output
  const to = convertImageOptionFormDataToImageReference(
    values.formData.images.pushTo,
    buildConfig.metadata.namespace,
  );
  if (to && !buildConfig.spec.output) {
    buildConfig.spec.output = { to };
  } else if (to) {
    buildConfig.spec.output.to = to;
  } else if (buildConfig.spec.output) {
    delete buildConfig.spec.output.to;
  }
};

const convertFormDataEnvironmentVariablesToBuildConfig = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  const env = values.formData.environmentVariables;

  // The strategy object is automatically created in convertFormDataToBuildConfigSource
  // if the source type is known. Fallback to Source strategy here if some
  // environment variables are defined.
  if (env.length > 0 && !buildConfig.spec.strategy?.type) {
    buildConfig.spec.strategy = {
      type: values.formData.images.strategyType || 'Source',
      ...buildConfig.spec.strategy,
    };
  }

  const strategyKey = `${buildConfig.spec.strategy?.type?.toLowerCase()}Strategy`;
  if (env.length > 0 && !buildConfig.spec.strategy?.[strategyKey]) {
    buildConfig.spec.strategy[strategyKey] = { env };
  } else if (env.length > 0) {
    buildConfig.spec.strategy[strategyKey].env = env;
  } else if (buildConfig.spec.strategy?.[strategyKey]) {
    delete buildConfig.spec.strategy[strategyKey].env;
  }
};

const convertFormDataTriggersToBuildConfig = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  const triggers: BuildConfigTrigger[] = [];

  if (values.formData.triggers?.configChange) {
    triggers.push({ type: 'ConfigChange' });
  }
  if (values.formData.triggers?.imageChange) {
    triggers.push({ type: 'ImageChange' });
  }
  if (values.formData.triggers?.otherTriggers) {
    triggers.push(
      ...values.formData.triggers.otherTriggers
        .filter((trigger) => trigger.type)
        .map(
          (trigger) =>
            ({
              type: trigger.type,
              [trigger.type.toLowerCase()]: { secret: trigger.secret },
            } as BuildConfigTrigger),
        ),
    );
  }

  if (triggers.length > 0) {
    buildConfig.spec.triggers = triggers;
  } else {
    delete buildConfig.spec.triggers;
  }
};

const convertFormDataSecretsToBuildConfig = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  const secrets = values.formData.secrets.map((secret) => ({
    secret: { name: secret.secret },
    destinationDir: secret.mountPoint,
  }));

  // The source object is automatically created in convertFormDataToBuildConfigSource
  // if the source type is known. Fallback to Source source here if some secrets are defined.
  if (secrets.length > 0 && !buildConfig.spec.source?.type) {
    buildConfig.spec.source = {
      type: 'Source',
      ...buildConfig.spec.source,
    };
  }

  if (secrets.length > 0) {
    buildConfig.spec.source = {
      ...buildConfig.spec.source,
      secrets,
    };
  } else if (buildConfig.spec.source?.secrets) {
    delete buildConfig.spec.source.secrets;
  }
};

const convertFormDataPolicyToBuildConfig = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  if (values.formData.policy.runPolicy) {
    buildConfig.spec.runPolicy = values.formData.policy.runPolicy;
  } else {
    delete buildConfig.spec.runPolicy;
  }
};

const convertFormDataHooksToBuildConfig = (
  values: BuildConfigFormikValues,
  buildConfig: BuildConfig,
) => {
  if (values.formData.hooks.enabled) {
    if (
      values.formData.hooks.type === 'command' &&
      values.formData.hooks.commands.some((command) => !!command)
    ) {
      buildConfig.spec.postCommit = {
        command: values.formData.hooks.commands,
        args: values.formData.hooks.arguments,
      };
    } else if (values.formData.hooks.type === 'shell') {
      buildConfig.spec.postCommit = {
        script: values.formData.hooks.shell,
        args: values.formData.hooks.arguments,
      };
    } else if (
      (values.formData.hooks.type === 'command' &&
        values.formData.hooks.arguments?.some((argument) => !!argument)) ||
      values.formData.hooks.type === 'onlyArgs'
    ) {
      buildConfig.spec.postCommit = {
        args: values.formData.hooks.arguments,
      };
    } else {
      delete buildConfig.spec.postCommit;
    }
  } else {
    delete buildConfig.spec.postCommit;
  }
};

export const convertFormDataToBuildConfig = (
  originBuildConfig: BuildConfig,
  values: BuildConfigFormikValues,
): BuildConfig => {
  // Ensure general format
  let buildConfig = _.cloneDeep(originBuildConfig);
  if (!buildConfig || typeof buildConfig !== 'object') {
    buildConfig = {
      apiVersion: 'build.openshift.io/v1',
      kind: 'BuildConfig',
      metadata: {},
      spec: {},
    };
  }
  if (!buildConfig.apiVersion) buildConfig.apiVersion = 'build.openshift.io/v1';
  if (!buildConfig.kind) buildConfig.kind = 'BuildConfig';
  if (!buildConfig.metadata || typeof buildConfig.metadata !== 'object') buildConfig.metadata = {};
  if (!buildConfig.spec || typeof buildConfig.spec !== 'object') buildConfig.spec = {};

  // Convert all sections
  convertFormDataNameToBuildConfig(values, buildConfig);
  convertFormDataToBuildConfigSource(values, buildConfig);
  convertFormDataImagesToBuildConfig(values, buildConfig);
  convertFormDataEnvironmentVariablesToBuildConfig(values, buildConfig);
  convertFormDataTriggersToBuildConfig(values, buildConfig);
  convertFormDataSecretsToBuildConfig(values, buildConfig);
  convertFormDataPolicyToBuildConfig(values, buildConfig);
  convertFormDataHooksToBuildConfig(values, buildConfig);

  return buildConfig;
};

export const convertFormDataToYAML = (values: BuildConfigFormikValues): string => {
  const parsedBuildConfig = safeYAMLToJS(values.yamlData);
  const updatedBuildConfig = convertFormDataToBuildConfig(parsedBuildConfig, values);
  return safeJSToYAML(updatedBuildConfig, '', { skipInvalid: true });
};
