import { BuildConfig, BuildConfigRunPolicy, BuildStrategyType } from '../../types';
import { convertBuildConfigToFormData } from '../convert-to-form';
import { getInitialBuildConfigFormikValues } from '../initial-data';

describe('convertBuildConfigToFormData', () => {
  it('keeps all initial form data with minimal BuildConfig', () => {
    const buildConfig: BuildConfig = {
      apiVersion: 'build.openshift.io/v1',
      kind: 'BuildConfig',
      metadata: {},
      spec: {},
    };

    const expectedValues = getInitialBuildConfigFormikValues();
    expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
  });

  it('keeps all initial form data with null BuildConfig', () => {
    const buildConfig = null as BuildConfig;

    const expectedValues = getInitialBuildConfigFormikValues();
    expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
  });

  describe('name section', () => {
    it('sets resource name in form data when BuildConfig has a name', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {
          name: 'a-buildconfig',
        },
        spec: {},
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.name = 'a-buildconfig';
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });

  describe('source section', () => {
    it('sets git source in form data when BuildConfig has a git resource without context dir', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Git',
            git: {
              uri: 'https://github.com/openshift/ruby-ex.git',
              ref: 'master',
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.source.type = 'git';
      expectedValues.formData.source.git.git.url = 'https://github.com/openshift/ruby-ex.git';
      expectedValues.formData.source.git.git.ref = 'master';
      expectedValues.formData.source.git.git.dir = '';
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets git source in form data when BuildConfig has a git resource with context dir', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Git',
            git: {
              uri: 'https://github.com/openshift/ruby-ex.git',
              ref: 'master',
            },
            contextDir: '/another-folder',
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.source.type = 'git';
      expectedValues.formData.source.git.git.url = 'https://github.com/openshift/ruby-ex.git';
      expectedValues.formData.source.git.git.ref = 'master';
      expectedValues.formData.source.git.git.dir = '/another-folder';
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets git secret in form data when BuildConfig has a git resource with a secret', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Git',
            git: {
              uri: 'https://github.com/openshift/ruby-ex.git',
              ref: 'master',
            },
            sourceSecret: {
              name: 'github-secret',
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.source.type = 'git';
      expectedValues.formData.source.git.git.url = 'https://github.com/openshift/ruby-ex.git';
      expectedValues.formData.source.git.git.ref = 'master';
      expectedValues.formData.source.git.git.dir = '';
      expectedValues.formData.source.git.git.secret = 'github-secret';
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets dockerfile source in form data when BuildConfig has a dockerfile resource', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Dockerfile',
            dockerfile: 'FROM centos\nRUN echo hello world',
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.source.type = 'dockerfile';
      expectedValues.formData.source.dockerfile = 'FROM centos\nRUN echo hello world';
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });

  describe('images section', () => {
    it('sets image build-from correctly based on BuildConfig sourceStrategy', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {
          namespace: 'a-namespace',
        },
        spec: {
          strategy: {
            type: 'Source',
            sourceStrategy: {
              from: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'ruby:2.7',
              },
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.source.git.project.name = 'a-namespace';
      expectedValues.formData.images.strategyType = BuildStrategyType.Source;
      expectedValues.formData.images.buildFrom.type = 'imageStreamTag';
      expectedValues.formData.images.buildFrom.imageStreamTag.fromImageStreamTag = true;
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.namespace = 'openshift';
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.image = 'ruby';
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.tag = '2.7';
      expectedValues.formData.images.buildFrom.imageStreamTag.project.name = 'openshift';
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets image push-to with BuildConfig namespace based on BuildConfig output', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {
          namespace: 'a-namespace',
        },
        spec: {
          output: {
            to: {
              kind: 'ImageStreamTag',
              name: 'nodejs-ex-git:latest',
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.source.git.project.name = 'a-namespace';
      expectedValues.formData.images.pushTo.type = 'imageStreamTag';
      expectedValues.formData.images.pushTo.imageStreamTag.fromImageStreamTag = true;
      expectedValues.formData.images.pushTo.imageStreamTag.imageStream.namespace = 'a-namespace';
      expectedValues.formData.images.pushTo.imageStreamTag.imageStream.image = 'nodejs-ex-git';
      expectedValues.formData.images.pushTo.imageStreamTag.imageStream.tag = 'latest';
      expectedValues.formData.images.pushTo.imageStreamTag.project.name = 'a-namespace';
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });

  describe('environment variables section', () => {
    it('sets environment variables based on BuildConfig strategy > sourceStrategy', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          strategy: {
            type: 'Source',
            sourceStrategy: {
              from: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'ruby:2.7',
              },
              env: [
                { name: 'env key 1', value: 'env value 1' },
                { name: 'env key 2', value: 'env value 2' },
              ],
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.images.strategyType = BuildStrategyType.Source;
      expectedValues.formData.images.buildFrom.type = 'imageStreamTag';
      expectedValues.formData.images.buildFrom.imageStreamTag.fromImageStreamTag = true;
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.namespace = 'openshift';
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.image = 'ruby';
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.tag = '2.7';
      expectedValues.formData.images.buildFrom.imageStreamTag.project.name = 'openshift';
      expectedValues.formData.environmentVariables = [
        { name: 'env key 1', value: 'env value 1' },
        { name: 'env key 2', value: 'env value 2' },
      ];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets environment variables based on BuildConfig strategy > dockerStrategy', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          strategy: {
            type: 'Docker',
            dockerStrategy: {
              dockerfilePath: 'Dockerfile',
              env: [
                { name: 'env key 1', value: 'env value 1' },
                { name: 'env key 2', value: 'env value 2' },
              ],
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.images.strategyType = BuildStrategyType.Docker;
      expectedValues.formData.environmentVariables = [
        { name: 'env key 1', value: 'env value 1' },
        { name: 'env key 2', value: 'env value 2' },
      ];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets environment variable configmap based on BuildConfig strategy > sourceStrategy', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          strategy: {
            type: 'Source',
            sourceStrategy: {
              from: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'ruby:2.7',
              },
              env: [
                { name: 'env key 1', value: 'env value 1' },
                {
                  name: 'env 2',
                  valueFrom: {
                    configMapKeyRef: { name: 'default-token-g4vc4', key: 'service-ca.crt' },
                  },
                },
              ],
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.images.strategyType = BuildStrategyType.Source;
      expectedValues.formData.images.buildFrom.type = 'imageStreamTag';
      expectedValues.formData.images.buildFrom.imageStreamTag.fromImageStreamTag = true;
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.namespace = 'openshift';
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.image = 'ruby';
      expectedValues.formData.images.buildFrom.imageStreamTag.imageStream.tag = '2.7';
      expectedValues.formData.images.buildFrom.imageStreamTag.project.name = 'openshift';
      expectedValues.formData.environmentVariables = [
        { name: 'env key 1', value: 'env value 1' },
        {
          name: 'env 2',
          valueFrom: {
            configMapKeyRef: { name: 'default-token-g4vc4', key: 'service-ca.crt' },
          },
        },
      ];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets environment variable secret based on BuildConfig strategy > dockerStrategy', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          strategy: {
            type: 'Docker',
            dockerStrategy: {
              dockerfilePath: 'Dockerfile',
              env: [
                { name: 'env key 1', value: 'env value 1' },
                {
                  name: 'env 2',
                  valueFrom: {
                    secretKeyRef: { name: 'default-token-g4vc4', key: 'service-ca.crt' },
                  },
                },
              ],
            },
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.images.strategyType = BuildStrategyType.Docker;
      expectedValues.formData.environmentVariables = [
        { name: 'env key 1', value: 'env value 1' },
        {
          name: 'env 2',
          valueFrom: {
            secretKeyRef: { name: 'default-token-g4vc4', key: 'service-ca.crt' },
          },
        },
      ];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });

  describe('triggers section', () => {
    it('sets config change and two other triggers based on BuildConfig triggers', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          triggers: [
            { type: 'ConfigChange' },
            { type: 'Generic', generic: { secret: '19a3' } },
            { type: 'GitHub', github: { secret: '2cd4' } },
          ],
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.triggers.configChange = true;
      expectedValues.formData.triggers.imageChange = false;
      expectedValues.formData.triggers.otherTriggers = [
        { type: 'Generic', secret: '19a3' },
        { type: 'GitHub', secret: '2cd4' },
      ];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets image change and two other triggers based on BuildConfig triggers', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          triggers: [
            { type: 'ImageChange', imageChange: { lastTriggeredImageID: '1234' } },
            { type: 'Generic', generic: { secret: '19a3' } },
            { type: 'GitHub', github: { secret: '2cd4' } },
          ],
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.triggers.configChange = false;
      expectedValues.formData.triggers.imageChange = true;
      expectedValues.formData.triggers.otherTriggers = [
        { type: 'Generic', secret: '19a3' },
        { type: 'GitHub', secret: '2cd4' },
      ];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });

  describe('secrets section', () => {
    it('sets the form secrets when BuildConfig source contains some secrets', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          source: {
            type: 'Dockerfile',
            dockerfile: 'FROM: centos\nRUN echo hello world',
            secrets: [{ secret: { name: 'buildsecret' }, destinationDir: 'secretdest' }],
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.source.type = 'dockerfile';
      expectedValues.formData.source.dockerfile = 'FROM: centos\nRUN echo hello world';
      expectedValues.formData.secrets = [{ secret: 'buildsecret', mountPoint: 'secretdest' }];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });

  describe('policy section', () => {
    it('sets no default runPolicy (use null) when BuildConfig runPolicy is not defined', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {},
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.policy.runPolicy = null;
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets a non default runPolicy based on BuildConfig runPolicy', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          runPolicy: BuildConfigRunPolicy.SerialLatestOnly,
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.policy.runPolicy = BuildConfigRunPolicy.SerialLatestOnly;
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });

  describe('hooks section', () => {
    it('sets the hook command when BuildConfig postCommit has just a command', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          postCommit: {
            command: ['echo', 'hello', 'world'],
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.hooks.enabled = true;
      expectedValues.formData.hooks.type = 'command';
      expectedValues.formData.hooks.commands = ['echo', 'hello', 'world'];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets the hook command and arguments when BuildConfig postCommit has command and arguments', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          postCommit: {
            command: ['echo'],
            args: ['hello', 'world'],
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.hooks.enabled = true;
      expectedValues.formData.hooks.type = 'command';
      expectedValues.formData.hooks.commands = ['echo'];
      expectedValues.formData.hooks.arguments = ['hello', 'world'];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets the hook shell with arguments when BuildConfig postCommit has a script', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          postCommit: {
            script: '#!/bin/bash\necho $*',
            args: ['hello', 'world'],
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.hooks.enabled = true;
      expectedValues.formData.hooks.type = 'shell';
      expectedValues.formData.hooks.shell = '#!/bin/bash\necho $*';
      expectedValues.formData.hooks.arguments = ['hello', 'world'];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });

    it('sets the onlyArgs option when BuildConfig postCommit has just arguments', () => {
      const buildConfig: BuildConfig = {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        metadata: {},
        spec: {
          postCommit: {
            args: ['hello', 'world'],
          },
        },
      };

      const expectedValues = getInitialBuildConfigFormikValues();
      expectedValues.formData.hooks.enabled = true;
      expectedValues.formData.hooks.type = 'onlyArgs';
      expectedValues.formData.hooks.arguments = ['hello', 'world'];
      expect(convertBuildConfigToFormData(buildConfig)).toEqual(expectedValues);
    });
  });
});
