import * as _ from 'lodash';
import { ImageOptionFormData } from '../sections/ImagesSection';
import { BuildConfig, ImageReference } from '../types';
import { getInitialBuildConfigFormikValues } from './initial-data';
import { BuildConfigFormikValues, BuildStrategyType } from './types';

const convertBuildConfigNameToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  values.formData.name = buildConfig.metadata.name || '';
};

const convertBuildConfigSourceToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  // Always set the project name (namespace) so that the AdvancedGitOptions
  // modal can create a secret in the right namespace.
  values.formData.source.git.project.name = buildConfig.metadata.namespace;

  if (buildConfig.spec.source?.type === 'Git') {
    values.formData.source.type = 'git';
    values.formData.source.git.git.url = buildConfig.spec.source.git?.uri || '';
    values.formData.source.git.git.ref = buildConfig.spec.source.git?.ref || '';
    values.formData.source.git.git.dir = buildConfig.spec.source.contextDir || '';
    values.formData.source.git.git.secret = buildConfig.spec.source.sourceSecret?.name || '';
    values.formData.source.git.build.strategy =
      (buildConfig.spec.strategy?.type as BuildStrategyType) || BuildStrategyType.Source;
  } else if (buildConfig.spec.source?.type === 'Dockerfile') {
    values.formData.source.type = 'dockerfile';
    values.formData.source.dockerfile = buildConfig.spec.source.dockerfile || '';
  } else if (buildConfig.spec.source?.type === 'Binary') {
    values.formData.source.type = 'binary';
  } else {
    values.formData.source.type = 'none';
  }
};

const convertImageReferenceToImageStreamFormData = (
  imageReference: ImageReference,
  imageOptionFormData: ImageOptionFormData,
  buildConfigNamespace: string,
) => {
  if (imageReference?.kind === 'ImageStreamTag') {
    const namespace = imageReference.namespace || buildConfigNamespace;
    const { name = '' } = imageReference;
    const image = name.includes(':') ? name.substring(0, name.indexOf(':')) : name;
    const tag = name.includes(':') ? name.substring(name.indexOf(':') + 1) : null;
    imageOptionFormData.type = 'imageStreamTag';
    imageOptionFormData.imageStreamTag = {
      fromImageStreamTag: true,
      isSearchingForImage: false,
      imageStream: {
        namespace,
        image,
        tag,
      },
      project: {
        name: namespace,
      },
      isi: {
        name: '',
        image: {},
        tag: '',
        status: { metadata: {}, status: '' },
        ports: [],
      },
      image: {
        name: '',
        image: {},
        tag: '',
        status: { metadata: {}, status: '' },
        ports: [],
      },
    };
  } else if (imageReference?.kind === 'ImageStreamImage') {
    const { namespace = '', name = '' } = imageReference;
    imageOptionFormData.type = 'imageStreamImage';
    imageOptionFormData.imageStreamImage = namespace ? `${namespace}/${name}` : name;
  } else if (imageReference?.kind === 'DockerImage') {
    imageOptionFormData.type = 'dockerImage';
    imageOptionFormData.dockerImage = imageReference.name || '';
  } else {
    imageOptionFormData.type = 'none';
  }
};

const convertBuildConfigImagesToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  values.formData.images.strategyType = buildConfig.spec.strategy?.type as BuildStrategyType;

  // Strategy => Build from
  const strategyKey = `${buildConfig.spec.strategy?.type?.toLowerCase()}Strategy`;
  const from = buildConfig.spec.strategy?.[strategyKey]?.from;
  convertImageReferenceToImageStreamFormData(
    from,
    values.formData.images.buildFrom,
    buildConfig.metadata.namespace,
  );

  // Output => Push to
  const to = buildConfig.spec.output?.to;
  convertImageReferenceToImageStreamFormData(
    to,
    values.formData.images.pushTo,
    buildConfig.metadata.namespace,
  );
};

const convertBuildConfigEnvironmentVariablesToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  if (buildConfig.spec.strategy?.type === 'Source') {
    const env = buildConfig.spec.strategy?.sourceStrategy?.env || [];
    values.formData.environmentVariables = env;
  } else if (buildConfig.spec.strategy?.type === 'Docker') {
    const env = buildConfig.spec.strategy?.dockerStrategy?.env || [];
    values.formData.environmentVariables = env;
  }
};

const convertBuildConfigTriggersToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  const triggers = buildConfig.spec.triggers || [];

  values.formData.triggers.configChange = !!triggers.find(
    (trigger) => trigger.type === 'ConfigChange',
  );
  values.formData.triggers.imageChange = !!triggers.find(
    (trigger) => trigger.type === 'ImageChange',
  );
  values.formData.triggers.otherTriggers = triggers
    .filter((trigger) => trigger.type && trigger[trigger.type.toLowerCase()]?.secret)
    .map((trigger) => ({
      type: trigger.type,
      secret: trigger[trigger.type.toLowerCase()].secret,
    }));
};

const convertBuildConfigSecretsToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  values.formData.secrets =
    buildConfig.spec.source?.secrets?.map((secret) => ({
      secret: secret.secret.name,
      mountPoint: secret.destinationDir,
    })) || [];
};

const convertBuildConfigPolicyToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  // Use null instead of undefined to match initial values
  values.formData.policy.runPolicy = buildConfig.spec.runPolicy || null;
};

const convertBuildConfigHooksToFormData = (
  buildConfig: BuildConfig,
  values: BuildConfigFormikValues,
) => {
  const commands = buildConfig.spec.postCommit?.command || [''];
  const shell = buildConfig.spec.postCommit?.script || '';
  const args = buildConfig.spec.postCommit?.args || [];

  if (commands.length > 0 && commands[0]) {
    values.formData.hooks.enabled = true;
    values.formData.hooks.type = 'command';
  } else if (shell) {
    values.formData.hooks.enabled = true;
    values.formData.hooks.type = 'shell';
  } else if (args.length > 0) {
    values.formData.hooks.enabled = true;
    values.formData.hooks.type = 'onlyArgs';
  } else {
    values.formData.hooks.enabled = false;
  }

  values.formData.hooks.commands = commands;
  values.formData.hooks.shell = shell;
  values.formData.hooks.arguments = args;
};

export const convertBuildConfigToFormData = (
  buildConfig: BuildConfig,
  originValues = getInitialBuildConfigFormikValues(),
): BuildConfigFormikValues => {
  const values = _.cloneDeep(originValues);

  const safeBuildConfig: BuildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata:
      buildConfig?.metadata && typeof buildConfig.metadata === 'object' ? buildConfig.metadata : {},
    spec: buildConfig?.spec && typeof buildConfig.spec === 'object' ? buildConfig.spec : {},
  };

  // Convert all sections
  convertBuildConfigNameToFormData(safeBuildConfig, values);
  convertBuildConfigSourceToFormData(safeBuildConfig, values);
  convertBuildConfigImagesToFormData(safeBuildConfig, values);
  convertBuildConfigEnvironmentVariablesToFormData(safeBuildConfig, values);
  convertBuildConfigTriggersToFormData(safeBuildConfig, values);
  convertBuildConfigSecretsToFormData(safeBuildConfig, values);
  convertBuildConfigPolicyToFormData(safeBuildConfig, values);
  convertBuildConfigHooksToFormData(safeBuildConfig, values);

  return values;
};
