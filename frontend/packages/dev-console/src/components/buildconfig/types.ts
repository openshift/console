/* eslint-disable no-barrel-files/no-barrel-files */
import type { ObjectMetadata, ObjectReference } from '@console/dynamic-plugin-sdk';
import type {
  NameValueFromPair,
  NameValuePair,
} from '@console/shared/src/components/formik-fields/field-types';

export { BuildConfigModel } from '@console/internal/models';
export { BuildStrategyType } from '@console/internal/components/utils/build-utils';

type LocalObjectReference = { name: string };

type ImageStreamTagReference = {
  kind: 'ImageStreamTag';
  namespace?: string;
  name: string;
};

type ImageStreamImageReference = {
  kind: 'ImageStreamImage';
  namespace?: string;
  name: string;
};

type DockerImageReference = {
  kind: 'DockerImage';
  name: string;
};

export type ImageReference =
  | ImageStreamTagReference
  | ImageStreamImageReference
  | DockerImageReference;

type BuildConfigGitSource = {
  type: 'Git';
  git: {
    uri: string;
    ref?: string;
  };
  contextDir?: string;
};

type BuildConfigDockerfileSource = {
  type: 'Dockerfile';
  dockerfile: string;
};

type BuildConfigBinarySource = {
  type: 'Binary';
  binary?: any;
};

type BuildConfigSource = (
  | BuildConfigGitSource
  | BuildConfigDockerfileSource
  | BuildConfigBinarySource
) & {
  configMaps?: { configMap: LocalObjectReference; destinationDir: string }[];
  secrets?: { secret: LocalObjectReference; destinationDir: string }[];
  sourceSecret?: LocalObjectReference;
};

type BuildConfigRevision = {
  type: 'Source' | 'Dockerfile' | 'Binary' | 'Images';
  git?: {
    author: { email: string; name: string };
    commit: string;
    committer: { email: string; name: string };
    message: string;
  };
};

type BuildConfigSourceStrategy = {
  type: 'Source';
  sourceStrategy?: {
    from?: ImageReference;
    env?: (NameValuePair | NameValueFromPair)[];
  };
  git?: {
    uri: string;
    ref: string;
    noProxy?: string;
    httpProxy?: string;
    httpsProxy?: string;
  };
  contextDir?: string;
  images?: {
    as: string[];
    from: ObjectReference;
    paths: { sourcePath: string; destinationDir: string }[];
    pullSecret: LocalObjectReference;
  }[];
  secrets?: { secret: LocalObjectReference; destinationDir: string }[];
  sourceSecret?: LocalObjectReference;
};

type BuildConfigDockerStrategy = {
  type: 'Docker';
  dockerStrategy: {
    from?: ImageReference;
    dockerfilePath?: string;
    env?: (NameValuePair | NameValueFromPair)[];
  };
};

type BuildConfigStrategy = (BuildConfigSourceStrategy | BuildConfigDockerStrategy) & {
  configMaps?: { configMap: LocalObjectReference; destinationDir: string }[];
};

type BuildConfigOutput = {
  imageLabels?: { name: string; value: string }[];
  pushSecret?: LocalObjectReference;
  to?: ImageReference;
};

type BuildConfigConfigChangeTrigger = {
  type: 'ConfigChange';
};

type BuildConfigImageChangeTrigger = {
  type: 'ImageChange';
  imageChange?: {
    lastTriggeredImageID?: string;
  };
};

type BuildConfigGenericTrigger = {
  type: 'Generic';
  generic: {
    allowEnv?: boolean;
    secret?: string;
    secretReference?: { name: string };
  };
};

type BuildConfigGitHubTrigger = {
  type: 'GitHub';
  github: {
    allowEnv?: boolean;
    secret?: string;
    secretReference?: { name: string };
  };
};

type BuildConfigGitLabTrigger = {
  type: 'GitLab';
  gitlab: {
    allowEnv?: boolean;
    secret?: string;
    secretReference?: { name: string };
  };
};

type BuildConfigBitbucketTrigger = {
  type: 'Bitbucket';
  bitbucket: {
    allowEnv?: boolean;
    secret?: string;
    secretReference?: { name: string };
  };
};

export type BuildConfigTrigger =
  | BuildConfigConfigChangeTrigger
  | BuildConfigImageChangeTrigger
  | BuildConfigGenericTrigger
  | BuildConfigGitHubTrigger
  | BuildConfigGitLabTrigger
  | BuildConfigBitbucketTrigger;

type BuildConfigPostCommit = {
  command?: string[];
  script?: string;
  args?: string[];
  commit?: string[];
};

export enum BuildConfigRunPolicy {
  Parallel = 'Parallel',
  Serial = 'Serial',
  SerialLatestOnly = 'SerialLatestOnly',
}

export type BuildConfig = {
  apiVersion: 'build.openshift.io/v1';
  kind: 'BuildConfig';
  metadata: ObjectMetadata;
  spec: {
    source?: BuildConfigSource;
    revision?: BuildConfigRevision;
    strategy?: BuildConfigStrategy;
    output?: BuildConfigOutput;
    triggers?: BuildConfigTrigger[];
    postCommit?: BuildConfigPostCommit;
    runPolicy?: BuildConfigRunPolicy;
    serviceAccount?: string;
    completionDeadlineSeconds?: number;
    successfulBuildsHistoryLimit?: number;
    failedBuildsHistoryLimit?: number;
  };
  status?: never;
};
