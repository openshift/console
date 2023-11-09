import { Build, BuildRun } from '../types';

export const incompleteBuild = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'Build',
  metadata: {
    namespace: 'a-namespace',
    name: 'incomplete-build',
  },
} as Build;

export const buildWithLabels: Build = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'Build',
  metadata: {
    namespace: 'a-namespace',
    name: 'build-with-labels',
    labels: {
      'app.kubernetes.io/part-of': 'buildpack-nodejs-build',
    },
  },
  spec: {
    source: {
      url: 'https://github.com/shipwright-io/sample-nodejs',
      contextDir: 'source-build',
    },
    strategy: {
      name: 'buildpacks-v3',
      kind: 'BuildStrategy',
    },
    output: {
      image:
        'image-registry.openshift-image-registry.svc:5000/build-examples/buildpack-nodejs-build',
    },
  },
};

export const incompleteBuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'incomplete-buildrun',
  },
} as BuildRun;

export const buildRunWithLabels: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    generateName: 'buildrun-with-labels-',
    name: 'buildrun-with-labels-1234',
    labels: {
      'build.shipwright.io/name': 'build-with-labels',
      'app.kubernetes.io/part-of': 'buildpack-nodejs-build',
    },
  },
  spec: {
    buildRef: {
      name: 'build-with-labels',
    },
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
    buildSpec: {
      output: {
        image: '',
      },
      source: {
        url: '',
      },
      strategy: {
        name: '',
      },
    },
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
    buildSpec: {
      output: {
        image: '',
      },
      source: {
        url: '',
      },
      strategy: {
        name: '',
      },
    },
  },
};

export const pendingBuildRun: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'pending-buildrun',
  },
  spec: {},
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'Unknown',
        reason: 'Pending',
        message: '',
        lastTransitionTime: '',
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
  spec: {},
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'Unknown',
        reason: 'Running',
        message: '',
        lastTransitionTime: '',
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
  spec: {},
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'True',
        reason: '',
        message: '',
        lastTransitionTime: '',
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
  spec: {},
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'False',
        reason: '',
        message: '',
        lastTransitionTime: '',
      },
    ],
  },
};
