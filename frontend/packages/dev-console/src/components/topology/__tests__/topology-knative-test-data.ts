import { FirehoseResult } from '@console/internal/components/utils';
import { DeploymentKind, PodKind, K8sResourceConditionStatus } from '@console/internal/module/k8s';
import {
  ConfigurationModel,
  RouteModel,
  RevisionModel,
  ServiceModel,
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
  EventSourceSinkBindingModel,
  ConditionTypes,
  RevisionKind,
  RouteKind,
  ServiceKind as knativeServiceKind,
  EventSourceApiServerModel,
} from '@console/knative-plugin';
import { TopologyDataResources } from '../topology-types';

export const sampleKnativeDeployments: FirehoseResult<DeploymentKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
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
          app: 'overlayimage-9jsl8',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `${RevisionModel.apiGroup}/${RevisionModel.apiVersion}`,
            kind: RevisionModel.kind,
            name: 'overlayimage-fdqsf',
            uid: '02c34a0e-9638-11e9-b134-06a61d886b62',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
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
              app: 'overlayimage-9jsl8',
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
          spec: {
            containers: [],
          },
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

export const sampleKnativeReplicaSets: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'apps/v1',
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
          app: 'overlayimage-9jsl8',
          'pod-template-hash': '5d9685cc74',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
      },
      spec: {
        template: {
          spec: {
            containers: [],
          },
        },
      },
      status: {
        replicas: 0,
        observedGeneration: 1,
      },
    },
  ],
};

export const sampleKnativePods: FirehoseResult<PodKind[]> = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleKnativeReplicationControllers: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleKnativeDeploymentConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleRoutes: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

const sampleKnativeBuildConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

const sampleKnativeBuilds: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleKnativeConfigurations: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${ConfigurationModel.apiGroup}/${ConfigurationModel.apiVersion}`,
      kind: ConfigurationModel.kind,
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/configurations/overlayimage',
        uid: '1317f615-9636-11e9-b134-06a61d886b62',
        resourceVersion: '1157349',
        labels: {
          'serving.knative.dev/route': 'overlayimage',
          'serving.knative.dev/service': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `${RouteModel.apiGroup}/${RouteModel.apiVersion}`,
            kind: RouteModel.kind,
            name: 'overlayimage',
            uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {},
      status: {
        observedGeneration: 1,
        latestCreatedRevisionName: 'overlayimage-fdqsf',
        latestReadyRevisionName: 'overlayimage-fdqsf',
      },
    },
  ],
};

export const revisionObj: RevisionKind = {
  apiVersion: `${RevisionModel.apiGroup}/${RevisionModel.apiVersion}`,
  kind: RevisionModel.kind,
  metadata: {
    name: 'overlayimage-fdqsf',
    namespace: 'testproject3',
    selfLink: '/api/v1/namespaces/testproject3/revisions/overlayimage',
    uid: '02c34a0e-9638-11e9-b134-06a61d886b62',
    resourceVersion: '1157349',
    creationTimestamp: '2019-06-12T07:07:57Z',
    labels: {
      'serving.knative.dev/configuration': 'overlayimage',
      'serving.knative.dev/configurationGeneration': '2',
      'serving.knative.dev/service': 'overlayimage',
    },
    ownerReferences: [
      {
        apiVersion: `${ConfigurationModel.apiGroup}/${ConfigurationModel.apiVersion}`,
        kind: RouteModel.kind,
        name: 'overlayimage',
        uid: '1317f615-9636-11e9-b134-06a61d886b62',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
  },
  spec: {},
  status: {
    observedGeneration: 1,
    serviceName: 'overlayimage-fdqsf',
    conditions: [
      {
        lastTransitionTime: '2019-12-27T05:07:47Z',
        message: 'The target is not receiving traffic.',
        reason: 'NoTraffic',
        status: K8sResourceConditionStatus.False,
        type: ConditionTypes.Active,
      },
      {
        lastTransitionTime: '2019-12-27T05:06:47Z',
        status: K8sResourceConditionStatus.True,
        type: ConditionTypes.ContainerHealthy,
        message: '',
        reason: '',
      },
      {
        lastTransitionTime: '2019-12-27T05:06:47Z',
        status: K8sResourceConditionStatus.True,
        type: ConditionTypes.Ready,
        message: '',
        reason: '',
      },
      {
        lastTransitionTime: '2019-12-27T05:06:16Z',
        status: K8sResourceConditionStatus.True,
        type: ConditionTypes.ResourcesAvailable,
        message: '',
        reason: '',
      },
    ],
  },
};
export const sampleKnativeRevisions: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [revisionObj],
};

export const knativeRouteObj: RouteKind = {
  apiVersion: `${RouteModel.apiGroup}/${RouteModel.apiVersion}`,
  kind: RouteModel.kind,
  metadata: {
    name: 'overlayimage',
    namespace: 'testproject3',
    selfLink: '/api/v1/namespaces/testproject3/routes/overlayimage',
    uid: '1317f615-9636-11e9-b134-06a61d886b62',
    resourceVersion: '1157349',
    creationTimestamp: '2019-06-12T07:07:57Z',
    labels: {
      'serving.knative.dev/route': 'overlayimage',
      'serving.knative.dev/service': 'overlayimage',
    },
    ownerReferences: [
      {
        apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
        kind: RouteModel.kind,
        name: 'overlayimage',
        uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
  },
  spec: {},
  status: {
    observedGeneration: 1,
    traffic: [{ latestRevision: true, percent: 100, revisionName: 'overlayimage-fdqsf' }],
    url: 'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    conditions: [
      { lastTransitionTime: '2019-12-27T05:06:47Z', status: 'True', type: 'AllTrafficAssigned' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'IngressReady' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'Ready' },
    ],
  },
};

export const sampleKnativeRoutes: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [knativeRouteObj],
};

export const knativeServiceObj: knativeServiceKind = {
  apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
  kind: ServiceModel.kind,
  metadata: {
    labels: {
      'app.kubernetes.io/part-of': 'myapp',
    },
    name: 'overlayimage',
    namespace: 'testproject3',
    selfLink: '/api/v1/namespaces/testproject3/services/overlayimage',
    uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
    resourceVersion: '1157349',
    generation: 1,
  },
  spec: {
    template: {
      metadata: {
        labels: {
          'app.kubernetes.io/part-of': 'myapp',
        },
      },
    },
  },
  status: {
    observedGeneration: 1,
    url: 'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    latestCreatedRevisionName: 'overlayimage-fdqsf',
    latestReadyRevisionName: 'overlayimage-fdqsf',
    traffic: [
      {
        latestRevision: true,
        percent: 100,
        revisionName: 'overlayimage-fdqsf',
      },
    ],
    conditions: [
      { lastTransitionTime: '2019-12-27T05:06:47Z', status: 'True', type: 'ConfigurationsReady' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'Ready' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'RoutesReady' },
    ],
  },
};

export const sampleKnativeServices: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [knativeServiceObj],
};

export const sampleEventSourceCronjob: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${EventSourceCronJobModel.apiGroup}/${EventSourceCronJobModel.apiVersion}`,
      kind: EventSourceCronJobModel.kind,
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        uid: '1317f615-9636-11e9-b134-06a61d886b689',
        creationTimestamp: '2019-06-12T07:07:57Z',
      },
      spec: {
        sink: {
          apiVersion: 'serving.knative.dev/v1alpha1',
          kind: 'Service',
          name: 'overlayimage',
        },
      },
    },
  ],
};

export const sampleEventSourceApiServer: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${EventSourceApiServerModel.apiGroup}/${EventSourceApiServerModel.apiVersion}`,
      kind: EventSourceApiServerModel.kind,
      metadata: {
        name: 'testevents',
        namespace: 'testproject1',
        uid: '1317f615-9636-11e9-b134-06a61d886b689',
        creationTimestamp: '2019-06-12T07:07:57Z',
      },
      spec: {
        sink: {
          apiVersion: 'serving.knative.dev/v1',
          kind: 'Service',
          name: 'overlayimage',
        },
      },
      status: {
        sinkUri: 'http://testevents.testproject1.svc.cluster.local',
      },
    },
  ],
};

export const sampleEventSourceContainers: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${EventSourceContainerModel.apiGroup}/${EventSourceContainerModel.apiVersion}`,
      kind: EventSourceContainerModel.kind,
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        uid: '1317f615-9636-11e9-b134-06a61d886b689',
        creationTimestamp: '2019-06-12T07:07:57Z',
      },
      spec: {
        sink: {
          apiVersion: 'serving.knative.dev/v1alpha1',
          kind: 'Service',
          name: 'overlayimage',
        },
      },
      status: {
        sinkUri: 'http://event-display.testproject3.svc.cluster.local',
      },
    },
  ],
};

export const sampleEventSourceCamel: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${EventSourceCamelModel.apiGroup}/${EventSourceCamelModel.apiVersion}`,
      kind: EventSourceCamelModel.kind,
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        uid: '1317f615-9636-11e9-b134-06a61d886b689',
        creationTimestamp: '2019-06-12T07:07:57Z',
      },
      spec: {},
    },
  ],
};

export const sampleEventSourceKafka: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${EventSourceKafkaModel.apiGroup}/${EventSourceKafkaModel.apiVersion}`,
      kind: EventSourceKafkaModel.kind,
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        uid: '1317f615-9636-11e9-b134-06a61d886b689',
        creationTimestamp: '2019-06-12T07:07:57Z',
      },
      spec: {
        sink: {
          apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
          kind: ServiceModel.kind,
          name: 'overlayimage',
        },
      },
    },
  ],
};

export const sampleEventSourceSinkbinding: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${EventSourceSinkBindingModel.apiGroup}/${EventSourceSinkBindingModel.apiVersion}`,
      kind: EventSourceSinkBindingModel.kind,
      metadata: {
        name: 'bind-wss',
        namespace: 'testproject3',
        uid: '1317f615-9636-11e9-b134-06a61d886b689',
        creationTimestamp: '2019-06-12T07:07:57Z',
      },
      spec: {
        sink: {
          ref: {
            apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
            kind: ServiceModel.kind,
            name: 'wss-event-display',
          },
        },
        subject: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          namespace: 'testproject3',
          selector: {
            matchLabels: {
              app: 'wss',
            },
          },
        },
      },
    },
  ],
};

export const sampleServices: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Service',
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/overlayimage',
        uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
        resourceVersion: '1157349',
        creationTimestamp: '2019-06-12T07:07:57Z',
        labels: {
          'serving.knative.dev/route': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `${RouteModel.apiGroup}/${RouteModel.apiVersion}`,
            kind: RouteModel.kind,
            name: 'overlayimage',
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
        name: 'overlayimage-9jsl8',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/overlayimage-9jsl8',
        uid: 'bd1b788b-8ce0-11e9-bb7b-0ebb55b110b8',
        resourceVersion: '1160881',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'overlayimage-9jsl8',
          'networking.internal.knative.dev/serverlessservice': 'overlayimage-9jsl8',
          'networking.internal.knative.dev/serviceType': 'Public',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `networking.internal.knative.dev/${ServiceModel.apiVersion}`,
            kind: 'ServerlessService',
            name: 'overlayimage-9jsl8',
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

export const samplePipeline: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const samplePipelineRun: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleClusterServiceVersions: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const MockKnativeResources: TopologyDataResources = {
  deployments: sampleKnativeDeployments,
  deploymentConfigs: sampleKnativeDeploymentConfigs,
  replicationControllers: sampleKnativeReplicationControllers,
  replicaSets: sampleKnativeReplicaSets,
  pods: sampleKnativePods,
  services: sampleServices,
  routes: sampleRoutes,
  buildConfigs: sampleKnativeBuildConfigs,
  builds: sampleKnativeBuilds,
  ksservices: sampleKnativeServices,
  ksroutes: sampleKnativeRoutes,
  configurations: sampleKnativeConfigurations,
  revisions: sampleKnativeRevisions,
  pipelines: samplePipeline,
  pipelineRuns: samplePipelineRun,
  eventSourceCronjob: sampleEventSourceCronjob,
  eventSourceContainers: sampleEventSourceContainers,
  eventSourceCamel: sampleEventSourceCamel,
  eventSourceKafka: sampleEventSourceKafka,
  eventSourceApiserver: sampleEventSourceApiServer,
  eventSourceSinkbinding: sampleEventSourceSinkbinding,
  clusterServiceVersions: sampleClusterServiceVersions,
};
