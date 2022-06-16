import { Build, BuildRun } from '../types';

export const incompleteBuild: Build = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'Build',
  metadata: {
    namespace: 'a-namespace',
    name: 'incomplete-build',
  },
};

export const incompleteBuildRun: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'incomplete-buildrun',
  },
};

export const buildRunReferenceIncompleteBuildWithoutGenerateName: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'buildrun1-11111',
  },
  spec: {
    buildRef: {
      name: 'incomplete-build',
    },
  },
};

export const buildRunReferenceIncompleteBuildWithGenerateName: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    generateName: 'buildrun2-',
    name: 'buildrun2-22222',
  },
  spec: {
    buildRef: {
      name: 'incomplete-build',
    },
  },
};

export const buildRunContainsIncompleteBuildSpecWithoutGenerateName: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'buildrun3-33333',
  },
  spec: {
    buildSpec: {},
  },
};

export const buildRunContainsIncompleteBuildSpecWithGenerateName: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    generateName: 'buildrun4-',
    name: 'buildrun4-44444',
  },
  spec: {
    buildSpec: {},
  },
};

export const pendingBuildRun: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'pending-buildrun',
  },
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'Unknown',
        reason: 'Pending',
        message: '',
      },
    ],
  },
};

export const runningBuildRun: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'running-buildrun',
  },
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'Unknown',
        reason: 'Running',
        message: '',
      },
    ],
  },
};

export const succeededBuildRun: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'Succeeded-buildrun',
  },
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'True',
        reason: '',
        message: '',
      },
    ],
  },
};

export const failedBuildRun: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'failed-buildrun',
  },
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'False',
        reason: '',
        message: '',
      },
    ],
  },
};
