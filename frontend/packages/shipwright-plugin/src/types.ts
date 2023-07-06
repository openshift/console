import { K8sResourceCommon, K8sResourceCondition } from '@console/internal/module/k8s';

export type BuildStrategyRef = {
  name: string;
  kind: string;
};

export type BuildSource = {
  url: string;
  contextDir?: string;
  credentials?: {
    name: string;
  };
};

export type BuildSources = {
  name: string;
  url: string;
}[];

export type BuildBuilder = {
  image: string;
};

export type BuildOutput = {
  image: string;
  credentials?: {
    name: string;
  };
};

/** @deprecated */
type BuildRuntime = any;

export type Build = K8sResourceCommon & {
  apiVersion: 'shipwright.io/v1alpha1';
  kind: 'Build';
  spec?: BuildSpec;
  status?: BuildStatus;
  latestBuild?: BuildRun;
};

export type BuildSpec = {
  strategy?: BuildStrategyRef;
  source?: BuildSource;
  sources?: BuildSources;
  dockerfile?: string;
  builder?: BuildBuilder;
  output?: BuildOutput;
  /** @deprecated */
  runtime?: BuildRuntime;
};

export type BuildStatus = {
  registered?: string;
  reason?: string;
  message?: string;
};

export type BuildRef = {
  name: string;
};

export type BuildRun = K8sResourceCommon & {
  apiVersion: 'shipwright.io/v1alpha1';
  kind: 'BuildRun';
  spec?: {
    buildRef?: BuildRef;
    buildSpec?: BuildSpec;
    serviceAccount?: {
      name: string;
    };
  };
  status?: {
    buildSpec?: BuildSpec;
    conditions?: BuildRunCondition[];
    startTime?: string;
    completionTime?: string;
    latestTaskRunRef?: string;
  };
};

export type BuildRunCondition = K8sResourceCondition;

// The enum values need to match the dynamic-plugin `Status` `status` prop.
// A translation (title) is added in the BuildRunStatus component.
export enum ComputedBuildRunStatus {
  PENDING = 'Pending',
  RUNNING = 'Running',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}
