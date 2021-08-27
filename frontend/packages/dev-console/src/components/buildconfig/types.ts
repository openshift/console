import { ObjectMetadata, ObjectReference } from '@console/dynamic-plugin-sdk';
import { NameValueFromPair, NameValuePair } from '@console/shared';

export { BuildConfigModel } from '@console/internal/models';
export { BuildStrategyType } from '@console/internal/components/build';

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

export type BuildConfigGitSource = {
  type: 'Git';
  git: {
    uri: string;
    ref: string;
  };
  contextDir?: string;
};

export type BuildConfigDockerfileSource = {
  type: 'Dockerfile';
  dockerfile: string;
};

export type BuildConfigBinarySource = {
  type: 'Binary';
  binary?: any;
};

export type BuildConfigSource = (
  | BuildConfigGitSource
  | BuildConfigDockerfileSource
  | BuildConfigBinarySource
) & {
  configMaps?: { configMap: LocalObjectReference; destinationDir: string }[];
  secrets?: { secret: LocalObjectReference; destinationDir: string }[];
  sourceSecret?: LocalObjectReference;
};

export type BuildConfigRevision = {
  type: 'Source' | 'Dockerfile' | 'Binary' | 'Images';
  git?: {
    author: { email: string; name: string };
    commit: string;
    committer: { email: string; name: string };
    message: string;
  };
};

export type BuildConfigSourceStrategy = {
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

export type BuildConfigDockerStrategy = {
  type: 'Docker';
  dockerStrategy: {
    from?: ImageReference;
    dockerfilePath?: string;
    env?: (NameValuePair | NameValueFromPair)[];
  };
};

export type BuildConfigStrategy = (BuildConfigSourceStrategy | BuildConfigDockerStrategy) & {
  configMaps?: { configMap: LocalObjectReference; destinationDir: string }[];
};

export type BuildConfigOutput = {
  imageLabels?: { name: string; value: string }[];
  pushSecret?: LocalObjectReference;
  to?: ImageReference;
};

export type BuildConfigConfigChangeTrigger = {
  type: 'ConfigChange';
};

export type BuildConfigImageChangeTrigger = {
  type: 'ImageChange';
  imageChange?: {
    lastTriggeredImageID?: string;
  };
};

export type BuildConfigGenericTrigger = {
  type: 'Generic';
  generic: {
    secret: string;
  };
};

export type BuildConfigGitHubTrigger = {
  type: 'GitHub';
  github: {
    secret: string;
  };
};

export type BuildConfigGitLabTrigger = {
  type: 'GitLab';
  gitlab: {
    secret: string;
  };
};

export type BuildConfigBitbucketTrigger = {
  type: 'Bitbucket';
  bitbucket: {
    secret: string;
  };
};

export type BuildConfigTrigger =
  | BuildConfigConfigChangeTrigger
  | BuildConfigImageChangeTrigger
  | BuildConfigGenericTrigger
  | BuildConfigGitHubTrigger
  | BuildConfigGitLabTrigger
  | BuildConfigBitbucketTrigger;

export type BuildConfigPostCommit = {
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
