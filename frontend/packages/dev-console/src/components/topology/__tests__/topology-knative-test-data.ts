/* eslint-disable no-unused-vars, no-undef */
import { TopologyDataResources, Resource } from '../topology-types';

export const sampleKnativeDeployments = {
  data: [
    {
      kind: 'Deployment',
      name: 'overlayimage-9jsl8-deployment',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
        },
        selfLink: '/apis/apps/v1/namespaces/testproject1/deployments/overlayimage-9jsl8-deployment',
        resourceVersion: '726179',
        name: 'overlayimage-9jsl8-deployment',
        uid: 'bccad3e4-8ce0-11e9-bb7b-0ebb55b110b8',
        creationTimestamp: '2019-04-22T11:35:43Z',
        generation: 2,
        namespace: 'testproject1',
        labels: {
          app: 'overlayimage123456-9jsl8',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
      },
      spec: {
        replicas: 0,
        selector: {
          matchLabels: {
            'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'overlayimage123456-9jsl8',
              'serving.knative.dev/configuration': 'overlayimage',
              'serving.knative.dev/configurationGeneration': '1',
              'serving.knative.dev/revision': 'overlayimage-9jsl8',
              'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
              'serving.knative.dev/service': 'overlayimage',
            },
            annotations: {
              'sidecar.istio.io/inject': 'true',
              'traffic.sidecar.istio.io/includeOutboundIPRanges': '172.30.0.0/16',
            },
          },
          spec: {},
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%',
          },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {},
    },
  ],
};

export const sampleKnativeReplicaSets: Resource = {
  data: [
    {
      kind: 'ReplicaSet',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/desired-replicas': '0',
          'deployment.kubernetes.io/max-replicas': '0',
          'deployment.kubernetes.io/revision': '1',
        },
        selfLink:
          '/apis/apps/v1/namespaces/testproject3/replicasets/overlayimage-9jsl8-deployment-5d9685cc74',
        resourceVersion: '1389053',
        name: 'overlayimage-9jsl8-deployment-5d9685cc74',
        uid: 'bccd5351-8ce0-11e9-9020-0ab4b49bd478',
        creationTimestamp: '2019-06-12T07:07:27Z',
        generation: 1,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: '"overlayimage-9jsl8-deployment"',
            uid: 'bccad3e4-8ce0-11e9-bb7b-0ebb55b110b8',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'overlayimage123456-9jsl8',
          'pod-template-hash': '5d9685cc74',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
      },
      spec: {},
      status: {
        replicas: 0,
        observedGeneration: 1,
      },
    },
  ],
};

export const sampleKnativePods: Resource = {
  data: [],
};

export const sampleKnativeReplicationControllers: Resource = {
  data: [],
};

export const sampleKnativeDeploymentConfigs: Resource = {
  data: [],
};

export const sampleKnativeRoutes: Resource = {
  data: [],
};

const sampleKnativeBuildConfigs: Resource = {
  data: [],
};

export const sampleKnativeServices: Resource = {
  data: [
    {
      kind: 'Service',
      metadata: {
        name: 'overlayimage123456',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/overlayimage123456',
        uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
        resourceVersion: '1157349',
        creationTimestamp: '2019-06-12T07:07:57Z',
        labels: {
          'serving.knative.dev/route': 'overlayimage123456',
        },
        ownerReferences: [
          {
            apiVersion: 'serving.knative.dev/v1alpha1',
            kind: 'Route',
            name: 'overlayimage123456',
            uid: 'bca0d598-8ce0-11e9-bb7b-0ebb55b110b8',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        externalName: 'istio-ingressgateway.istio-system.svc.cluster.local',
        sessionAffinity: 'None',
        type: 'ExternalName',
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      kind: 'Service',
      metadata: {
        name: 'overlayimage123456-9jsl8',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/overlayimage123456-9jsl8',
        uid: 'bd1b788b-8ce0-11e9-bb7b-0ebb55b110b8',
        resourceVersion: '1160881',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'overlayimage123456-9jsl8',
          'networking.internal.knative.dev/serverlessservice': 'overlayimage123456-9jsl8',
          'networking.internal.knative.dev/serviceType': 'Public',
          'serving.knative.dev/configuration': 'overlayimage123456',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage123456-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage123456',
        },
        ownerReferences: [
          {
            apiVersion: 'networking.internal.knative.dev/v1alpha1',
            kind: 'ServerlessService',
            name: 'overlayimage123456-9jsl8',
            uid: 'bcf5bfcf-8ce0-11e9-9020-0ab4b49bd478',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        annotations: {
          'autoscaling.knative.dev/class': 'kpa.autoscaling.knative.dev',
        },
      },
      spec: {
        sessionAffinity: 'None',
        type: 'ClusterIP',
        clusterIP: '172.30.252.203',
      },
      status: {
        loadBalancer: {},
      },
    },
  ],
};

export const MockKnativeResources: TopologyDataResources = {
  deployments: sampleKnativeDeployments,
  deploymentConfigs: sampleKnativeDeploymentConfigs,
  replicationControllers: sampleKnativeReplicationControllers,
  replicasets: sampleKnativeReplicaSets,
  pods: sampleKnativePods,
  services: sampleKnativeServices,
  routes: sampleKnativeRoutes,
  buildconfigs: sampleKnativeBuildConfigs,
};
