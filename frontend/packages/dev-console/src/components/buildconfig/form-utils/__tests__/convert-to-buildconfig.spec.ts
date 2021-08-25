import { BuildConfig, BuildConfigRunPolicy } from '../../types';
import { convertFormDataToBuildConfig } from '../convert-to-buildconfig';
import { getInitialBuildConfigFormikValues } from '../initial-data';

describe('convertFormDataToBuildConfig', () => {
  const expectedDefaultBuildConfig: BuildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name: '',
    },
    spec: {},
  };

  it('converts getInitialBuildConfigFormikValues to a BuildConfig', () => {
    const originBuildConfig: BuildConfig = {
      apiVersion: 'build.openshift.io/v1',
      kind: 'BuildConfig',
      metadata: {},
      spec: {},
    };
    const values = getInitialBuildConfigFormikValues();
    expect(convertFormDataToBuildConfig(originBuildConfig, values)).toEqual(
      expectedDefaultBuildConfig,
    );
  });

  it('converts also null to a BuildConfig', () => {
    const originBuildConfig = null as BuildConfig;
    const values = getInitialBuildConfigFormikValues();

    expect(convertFormDataToBuildConfig(originBuildConfig, values)).toEqual(
      expectedDefaultBuildConfig,
    );
  });

  it('adds missing attributes to an empty BuildConfig object', () => {
    const originBuildConfig = {} as BuildConfig;
    const values = getInitialBuildConfigFormikValues();

    expect(convertFormDataToBuildConfig(originBuildConfig, values)).toEqual(
      expectedDefaultBuildConfig,
    );
  });

  describe('name section', () => {
    it('converts a git source form data to BuildConfig metadata', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.name = 'another-resource-name';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.metadata).toEqual({
        name: 'another-resource-name',
      });
    });
  });

  describe('source section', () => {
    it('converts a git source form data to BuildConfig source and set default source strategy', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.source.type = 'git';
      values.formData.source.git.git.url = 'https://github.com/openshift/console';
      values.formData.source.git.git.ref = 'master';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Git',
        git: {
          uri: 'https://github.com/openshift/console',
          ref: 'master',
        },
        contextDir: '/',
      });
      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
      });
    });

    it('converts a git source with secret to BuildConfig source with sourceSecret', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.source.type = 'git';
      values.formData.source.git.git.url = 'https://github.com/openshift/console';
      values.formData.source.git.git.ref = 'master';
      values.formData.source.git.git.secret = 'github-secret';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Git',
        git: {
          uri: 'https://github.com/openshift/console',
          ref: 'master',
        },
        contextDir: '/',
        sourceSecret: {
          name: 'github-secret',
        },
      });
      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
      });
    });

    it('merges a git source form data to BuildConfig source and keeps other existing configs', () => {
      const originBuildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Git',
            git: {
              uri: 'https://github.com/openshift/console',
              ref: 'master',
            },
            contextDir: '/',
            configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
          },
          strategy: {
            type: 'Source',
            configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
            secrets: [{ secret: { name: 'a-secret' }, destinationDir: '/secret' }],
          },
        },
      };

      const values = getInitialBuildConfigFormikValues();
      values.formData.source.type = 'git';
      values.formData.source.git.git.url = 'https://github.com/openshift/console';
      values.formData.source.git.git.ref = 'master';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Git',
        git: {
          uri: 'https://github.com/openshift/console',
          ref: 'master',
        },
        contextDir: '/',
        configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
      });
      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
        secrets: [{ secret: { name: 'a-secret' }, destinationDir: '/secret' }],
      });
    });

    it('converts a Dockerfile source form data to BuildConfig source and set docker strategy if not defined', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.source.type = 'dockerfile';
      values.formData.source.dockerfile = 'FROM centos\nRUN echo hello world';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Dockerfile',
        dockerfile: 'FROM centos\nRUN echo hello world',
      });
      expect(buildConfig.spec.strategy).toEqual({
        type: 'Docker',
      });
    });

    it('merges a Dockerfile source form data to BuildConfig source and keeps other existing configs', () => {
      const originBuildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Dockerfile',
            dockerfile: 'FROM centos\nRUN echo old dockerfile',
            configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
          },
          strategy: {
            type: 'Docker',
            dockerStrategy: {
              dockerfilePath: 'Dockerfile',
            },
            configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
          },
        },
      };

      const values = getInitialBuildConfigFormikValues();
      values.formData.source.type = 'dockerfile';
      values.formData.source.dockerfile = 'FROM centos\nRUN echo new dockerfile';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Dockerfile',
        dockerfile: 'FROM centos\nRUN echo new dockerfile',
        configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
      });
      expect(buildConfig.spec.strategy).toEqual({
        type: 'Docker',
        dockerStrategy: {
          dockerfilePath: 'Dockerfile',
        },
        configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
      });
    });

    it('switches from a git source to a dockerfile source', () => {
      const originBuildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Git',
            git: {
              uri: 'https://github.com/openshift/console',
              ref: 'master',
            },
            contextDir: '/',
            configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
          },
        },
      };
      const values = getInitialBuildConfigFormikValues();
      values.formData.source.type = 'dockerfile';
      values.formData.source.dockerfile = 'FROM centos\nRUN echo new dockerfile';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Dockerfile',
        dockerfile: 'FROM centos\nRUN echo new dockerfile',
        contextDir: '/',
        configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
      });
    });

    it('switches from a dockerfile source to a git source', () => {
      const originBuildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Dockerfile',
            dockerfile: 'FROM centos\nRUN echo old dockerfile',
            configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
          },
        },
      };
      const values = getInitialBuildConfigFormikValues();
      values.formData.source.type = 'git';
      values.formData.source.git.git.url = 'https://github.com/openshift/console';
      values.formData.source.git.git.ref = 'master';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Git',
        git: {
          uri: 'https://github.com/openshift/console',
          ref: 'master',
        },
        contextDir: '/',
        configMaps: [{ configMap: { name: 'a-configmap' }, destinationDir: '/configmap' }],
      });
    });
  });

  describe('images section', () => {
    it('converts a buildFrom ImageStreamTag in another namespace to BuildConfig strategy', () => {
      const originBuildConfig = {
        metadata: {
          namespace: 'current-namespace',
        },
      } as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.buildFrom.type = 'imageStreamTag';
      values.formData.images.buildFrom.imageStreamTag.fromImageStreamTag = true;
      values.formData.images.buildFrom.imageStreamTag.imageStream.namespace = 'openshift';
      values.formData.images.buildFrom.imageStreamTag.imageStream.image = 'ruby';
      values.formData.images.buildFrom.imageStreamTag.imageStream.tag = '2.7';
      values.formData.images.buildFrom.imageStreamTag.project.name = 'openshift';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamTag',
            namespace: 'openshift',
            name: 'ruby:2.7',
          },
        },
      });
    });

    it('converts a buildFrom ImageStreamTag in same namespace to BuildConfig strategy', () => {
      const originBuildConfig = {
        metadata: {
          namespace: 'current-namespace',
        },
      } as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.buildFrom.type = 'imageStreamTag';
      values.formData.images.buildFrom.imageStreamTag.fromImageStreamTag = true;
      values.formData.images.buildFrom.imageStreamTag.imageStream.namespace = 'current-namespace';
      values.formData.images.buildFrom.imageStreamTag.imageStream.image = 'ruby';
      values.formData.images.buildFrom.imageStreamTag.imageStream.tag = '2.7';
      values.formData.images.buildFrom.imageStreamTag.project.name = 'current-namespace';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamTag',
            // No namespace
            name: 'ruby:2.7',
          },
        },
      });
    });

    it('converts a buildFrom ImageStreamImage in another namespace to BuildConfig strategy', () => {
      const originBuildConfig = {
        metadata: {
          namespace: 'current-namespace',
        },
      } as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.buildFrom.type = 'imageStreamImage';
      values.formData.images.buildFrom.imageStreamImage = 'openshift/ruby';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamImage',
            namespace: 'openshift',
            name: 'ruby',
          },
        },
      });
    });

    it('converts a buildFrom ImageStreamImage in same namespace to BuildConfig strategy', () => {
      const originBuildConfig = {
        metadata: {
          namespace: 'current-namespace',
        },
      } as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.buildFrom.type = 'imageStreamImage';
      values.formData.images.buildFrom.imageStreamImage = 'current-namespace/an-image';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamImage',
            namespace: 'current-namespace',
            name: 'an-image',
          },
        },
      });
    });

    it('converts a buildFrom ImageStreamImage in without namespace to BuildConfig strategy', () => {
      const originBuildConfig = {
        metadata: {
          namespace: 'current-namespace',
        },
      } as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.buildFrom.type = 'imageStreamImage';
      values.formData.images.buildFrom.imageStreamImage = 'just-an-image';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamImage',
            namespace: 'current-namespace', // automatically fallback to the BuildConfig namespace
            name: 'just-an-image',
          },
        },
      });
    });

    it('converts a buildFrom DockerImage to BuildConfig strategy', () => {
      const originBuildConfig = {
        metadata: {
          namespace: 'current-namespace',
        },
      } as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.buildFrom.type = 'dockerImage';
      values.formData.images.buildFrom.dockerImage = 'centos';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'DockerImage',
            name: 'centos',
          },
        },
      });
    });

    it('converts a pushTo ImageStreamTag to BuildConfig output', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.pushTo.type = 'imageStreamTag';
      values.formData.images.pushTo.imageStreamTag.fromImageStreamTag = true;
      values.formData.images.pushTo.imageStreamTag.imageStream.namespace = 'openshift';
      values.formData.images.pushTo.imageStreamTag.imageStream.image = 'nodejs-ex-git';
      values.formData.images.pushTo.imageStreamTag.imageStream.tag = 'latest';
      values.formData.images.pushTo.imageStreamTag.project.name = 'openshift';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.output).toEqual({
        to: {
          kind: 'ImageStreamTag',
          namespace: 'openshift',
          name: 'nodejs-ex-git:latest',
        },
      });
    });

    it('converts a pushTo DockerImage to BuildConfig output', () => {
      const originBuildConfig = {
        metadata: {
          namespace: 'current-namespace',
        },
      } as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.images.pushTo.type = 'dockerImage';
      values.formData.images.pushTo.dockerImage = 'centos';

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.output).toEqual({
        to: {
          kind: 'DockerImage',
          name: 'centos',
        },
      });
    });
  });

  describe('environment variables section', () => {
    it('converts a environment variables to BuildConfig strategy', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.environmentVariables = [
        { name: 'env key 1', value: 'env value 1' },
        { name: 'env key 2', value: 'env value 2' },
      ];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.strategy).toEqual({
        type: 'Source',
        sourceStrategy: {
          env: [
            { name: 'env key 1', value: 'env value 1' },
            { name: 'env key 2', value: 'env value 2' },
          ],
        },
      });
    });
  });

  describe('triggers section', () => {
    it('convert no triggers to BuildConfig triggers', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.triggers).toBeFalsy();
    });

    it('convert config change trigger to BuildConfig trigger', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.triggers.configChange = true;

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.triggers).toEqual([{ type: 'ConfigChange' }]);
    });

    it('convert config image trigger to BuildConfig trigger', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.triggers.imageChange = true;

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.triggers).toEqual([{ type: 'ImageChange' }]);
    });

    it('convert config a custom trigger to BuildConfig trigger', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.triggers.otherTriggers = [
        { type: 'Generic', secret: '19a3' },
        { type: 'GitHub', secret: '2cd4' },
      ];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.triggers).toEqual([
        { type: 'Generic', generic: { secret: '19a3' } },
        { type: 'GitHub', github: { secret: '2cd4' } },
      ]);
    });

    it('convert config multiple trigger to BuildConfig trigger', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.triggers.configChange = true;
      values.formData.triggers.imageChange = true;
      values.formData.triggers.otherTriggers = [
        { type: 'Generic', secret: '19a3' },
        { type: 'GitHub', secret: '2cd4' },
      ];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.triggers).toEqual([
        { type: 'ConfigChange' },
        { type: 'ImageChange' },
        { type: 'Generic', generic: { secret: '19a3' } },
        { type: 'GitHub', github: { secret: '2cd4' } },
      ]);
    });
  });

  describe('secrets section', () => {
    it('converts a form secrets to BuildConfig source secrets', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.secrets = [
        { secret: 'secret-1', mountPoint: '/secret-1' },
        { secret: 'secret-2', mountPoint: '/secret-2' },
      ];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.source).toEqual({
        type: 'Source',
        secrets: [
          { secret: { name: 'secret-1' }, destinationDir: '/secret-1' },
          { secret: { name: 'secret-2' }, destinationDir: '/secret-2' },
        ],
      });
    });
  });

  describe('policy section', () => {
    it('convert default runPolicy to BuildConfig runPolicy', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.policy.runPolicy = null;

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.runPolicy).toBeFalsy();
    });

    it('convert non default runPolicy to BuildConfig runPolicy', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.policy.runPolicy = BuildConfigRunPolicy.Parallel;

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.runPolicy).toEqual(BuildConfigRunPolicy.Parallel);
    });
  });

  describe('hooks section', () => {
    it('skips hooks command when command is empty (default)', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.hooks.enabled = true;
      values.formData.hooks.commands = [''];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.postCommit).toBeFalsy();
    });

    it('converts hooks form data to BuildConfig postCommit', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.hooks.enabled = true;
      values.formData.hooks.commands = ['echo', 'hello', 'world'];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.postCommit).toEqual({
        command: ['echo', 'hello', 'world'],
        args: [],
      });
    });

    it('converts shell script with args hooks to BuildConfig postCommit', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.hooks.enabled = true;
      values.formData.hooks.commands = ['echo', 'hello', 'world'];
      values.formData.hooks.type = 'shell';
      values.formData.hooks.shell = '#!/bin/bash\necho hello world';
      values.formData.hooks.arguments = ['hello', 'world'];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.postCommit).toEqual({
        script: '#!/bin/bash\necho hello world',
        args: ['hello', 'world'],
      });
    });

    it('converts script with args hooks to BuildConfig postCommit', () => {
      const originBuildConfig = {} as BuildConfig;
      const values = getInitialBuildConfigFormikValues();
      values.formData.hooks.enabled = true;
      values.formData.hooks.commands = ['echo', 'hello', 'world'];
      values.formData.hooks.type = 'onlyArgs';
      values.formData.hooks.arguments = ['hello', 'world'];

      const buildConfig = convertFormDataToBuildConfig(originBuildConfig, values);

      expect(buildConfig.spec.postCommit).toEqual({
        args: ['hello', 'world'],
      });
    });
  });
});
