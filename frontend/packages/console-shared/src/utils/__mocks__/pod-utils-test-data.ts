import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';

export const deploymentConfig: K8sResourceKind = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'nodejs',
    namespace: 'testproject1',
    uid: '02f680df-680f-11e9-b69e-5254003f9382',
    labels: {
      app: 'nodejs',
    },
    annotations: {
      'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
      'app.openshift.io/vcs-ref': 'master',
      'idling.alpha.openshift.io/idled-at': 'mock-data',
      'openshift.io/deployment.phase': 'Complete',
    },
  },
  spec: {
    strategy: {
      type: 'Rolling',
    },
  },
};

export const statefulSets: K8sResourceKind = {
  kind: 'StatefulSet',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'ss-1',
    namespace: 'testproject1',
    uid: '02f680df-680f-11e9-b69e-5254003f9382',
    labels: {
      app: 'ss-1',
    },
  },
};

export const notIdledDeploymentConfig: K8sResourceKind = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'nodejs',
    namespace: 'testproject1',
    uid: '02f680df-680f-11e9-b69e-5254003f9382',
    labels: {
      app: 'nodejs',
    },
    annotations: {
      'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
      'app.openshift.io/vcs-ref': 'master',
    },
  },
};

export const deployment: K8sResourceKind = {
  kind: 'Deployment',
  metadata: {
    name: 'node',
    namespace: 'testproject1',
    uid: '02f680df-680f-b69e-5254003f9382',
    labels: {
      app: 'nodejs',
      'serving.knative.dev/configuration': 'mocks',
    },
    annotations: {
      'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
      'app.openshift.io/vcs-ref': 'master',
      'idling.alpha.openshift.io/idled-at': 'mock-data',
    },
  },
};

export const daemonSet: K8sResourceKind = {
  kind: 'DaemonSet',
  metadata: {
    name: 'node',
    namespace: 'testproject1',
    uid: '02f680df-680f-b69e-5254003f9382',
    labels: {
      app: 'nodejs',
      'serving.knative.dev/configuration': 'mocks',
    },
    annotations: {
      'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
      'app.openshift.io/vcs-ref': 'master',
      'idling.alpha.openshift.io/idled-at': 'mock-data',
    },
  },
  status: {
    currentNumberScheduled: 2,
    desiredNumberScheduled: 2,
  },
};

export const mockPod: K8sResourceKind = {
  kind: 'Pod',
  metadata: {
    generateName: 'analytics-deployment-59dd7c47d4-',
    annotations: {
      'openshift.io/scc': 'restricted',
    },
    resourceVersion: '1395096',
    name: 'analytics-deployment-59dd7c47d4-2jp7t',
    uid: '5cec460e-680d-11e9-8c69-5254003f9382',
    namespace: 'testproject3',
    ownerReferences: [
      {
        apiVersion: 'apps/v1',
        kind: 'ReplicaSet',
        name: 'analytics-deployment-59dd7c47d4',
        uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
    labels: {
      'app.kubernetes.io/component': 'backend',
      'app.kubernetes.io/instance': 'analytics',
      'app.kubernetes.io/name': 'python',
      'app.kubernetes.io/part-of': 'application-1',
      'app.kubernetes.io/version': '1.0',
      'pod-template-hash': '1588370380',
    },
  },
  spec: {
    containers: [],
  },
  status: {
    phase: 'Running',
  },
};

export const allpods: PodKind[] = [mockPod as PodKind];
