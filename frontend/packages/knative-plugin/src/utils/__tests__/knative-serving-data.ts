import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import {
  DeployImageFormData,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import { EventSourceFormData } from '../../components/add/import-types';
import { RevisionModel } from '../../models';
import { healthChecksProbeInitialData } from '@console/dev-console/src/components/health-checks/health-checks-probe-utils';

export const defaultData: DeployImageFormData = {
  project: {
    name: '',
    displayName: '',
    description: '',
  },
  application: {
    initial: '',
    name: '',
    selectedKey: '',
  },
  name: '',
  searchTerm: '',
  registry: 'external',
  imageStream: {
    image: '',
    tag: '',
    namespace: '',
  },
  isi: {
    name: '',
    image: {},
    tag: '',
    status: { metadata: {}, status: '' },
    ports: [],
  },
  image: {
    name: '',
    image: {},
    tag: '',
    status: { metadata: {}, status: '' },
    ports: [],
  },
  isSearchingForImage: false,
  resources: Resources.OpenShift,
  serverless: {
    scaling: {
      minpods: 1,
      maxpods: 5,
      concurrencytarget: 1,
      concurrencylimit: 1,
    },
  },
  route: {
    create: true,
    targetPort: '',
    unknownTargetPort: '',
    defaultUnknownPort: 8080,
    path: '',
    hostname: '',
    secure: false,
    tls: {
      termination: '',
      insecureEdgeTerminationPolicy: '',
      caCertificate: '',
      certificate: '',
      destinationCACertificate: '',
      privateKey: '',
    },
  },
  build: {
    env: [],
    triggers: {
      webhook: true,
      image: true,
      config: true,
    },
    strategy: 'Source',
  },
  deployment: {
    env: [],
    triggers: {
      image: true,
      config: true,
    },
    replicas: 1,
  },
  labels: {},
  env: {},
  limits: {
    cpu: {
      request: '',
      requestUnit: 'm',
      defaultRequestUnit: 'm',
      limit: '',
      limitUnit: 'm',
      defaultLimitUnit: 'm',
    },
    memory: {
      request: '',
      requestUnit: 'Mi',
      defaultRequestUnit: 'Mi',
      limit: '',
      limitUnit: 'Mi',
      defaultLimitUnit: 'Mi',
    },
  },
  healthChecks: healthChecksProbeInitialData,
};

export const deploymentData: K8sResourceKind = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: { 'deployment.kubernetes.io/revision': '1' },
    selfLink: '/apis/apps/v1/namespaces/testproject3/deployments/overlayimage',
    resourceVersion: '471849',
    name: 'overlayimage',
    uid: '64b34874-debd-11e9-8cdf-0a0700ae5e38',
    creationTimestamp: '2019-09-24T11:21:03Z',
    generation: 4,
    namespace: 'testproject3',
    labels: { 'app.kubernetes.io/part-of': 'application-3' },
  },
  spec: {
    replicas: 6,
    selector: { matchLabels: { app: 'hello-openshift' } },
    template: {
      metadata: { creationTimestamp: null, labels: { app: 'hello-openshift' } },
      spec: {
        containers: [
          {
            name: 'hello-openshift',
            image: 'openshift/hello-openshift',
            ports: [{ containerPort: 8080, protocol: 'TCP' }],
            resources: {},
            terminationMessagePath: '/dev/termination-log',
            terminationMessagePolicy: 'File',
            imagePullPolicy: 'Always',
          },
        ],
        restartPolicy: 'Always',
        terminationGracePeriodSeconds: 30,
        dnsPolicy: 'ClusterFirst',
        securityContext: {},
        schedulerName: 'default-scheduler',
      },
    },
    strategy: {
      type: 'RollingUpdate',
      rollingUpdate: { maxUnavailable: '25%', maxSurge: '25%' },
    },
    revisionHistoryLimit: 10,
    progressDeadlineSeconds: 600,
  },
  status: {
    observedGeneration: 4,
    replicas: 6,
    updatedReplicas: 6,
    readyReplicas: 6,
    availableReplicas: 6,
    conditions: [
      {
        type: 'Progressing',
        status: 'True',
        lastUpdateTime: '2019-09-24T11:21:14Z',
        lastTransitionTime: '2019-09-24T11:21:03Z',
        reason: 'NewReplicaSetAvailable',
        message: 'ReplicaSet "overlayimage-54b47fbb75" has successfully progressed.',
      },
      {
        type: 'Available',
        status: 'True',
        lastUpdateTime: '2019-09-24T11:24:57Z',
        lastTransitionTime: '2019-09-24T11:24:57Z',
        reason: 'MinimumReplicasAvailable',
        message: 'Deployment has minimum availability.',
      },
    ],
  },
};

export const deploymentKnativeData: K8sResourceKind = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: { 'deployment.kubernetes.io/revision': '1' },
    selfLink: '/apis/apps/v1/namespaces/testproject3/deployments/overlayimage',
    resourceVersion: '471849',
    name: 'overlayimage',
    uid: '64b34874-debd-11e9-8cdf-0a0700ae5e38',
    creationTimestamp: '2019-09-24T11:21:03Z',
    generation: 4,
    namespace: 'testproject3',
    labels: {
      'app.kubernetes.io/part-of': 'application-3',
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
    replicas: 6,
    selector: { matchLabels: { app: 'hello-openshift' } },
    template: {
      metadata: { creationTimestamp: null, labels: { app: 'hello-openshift' } },
      spec: {
        containers: [
          {
            name: 'hello-openshift',
            image: 'openshift/hello-openshift',
            ports: [{ containerPort: 8080, protocol: 'TCP' }],
            resources: {},
            terminationMessagePath: '/dev/termination-log',
            terminationMessagePolicy: 'File',
            imagePullPolicy: 'Always',
          },
        ],
        restartPolicy: 'Always',
        terminationGracePeriodSeconds: 30,
        dnsPolicy: 'ClusterFirst',
        securityContext: {},
        schedulerName: 'default-scheduler',
      },
    },
    strategy: {
      type: 'RollingUpdate',
      rollingUpdate: { maxUnavailable: '25%', maxSurge: '25%' },
    },
    revisionHistoryLimit: 10,
    progressDeadlineSeconds: 600,
  },
  status: {
    observedGeneration: 4,
    replicas: 6,
    updatedReplicas: 6,
    readyReplicas: 6,
    availableReplicas: 6,
    conditions: [
      {
        type: 'Progressing',
        status: 'True',
        lastUpdateTime: '2019-09-24T11:21:14Z',
        lastTransitionTime: '2019-09-24T11:21:03Z',
        reason: 'NewReplicaSetAvailable',
        message: 'ReplicaSet "overlayimage-54b47fbb75" has successfully progressed.',
      },
      {
        type: 'Available',
        status: 'True',
        lastUpdateTime: '2019-09-24T11:24:57Z',
        lastTransitionTime: '2019-09-24T11:24:57Z',
        reason: 'MinimumReplicasAvailable',
        message: 'Deployment has minimum availability.',
      },
    ],
  },
};

const eventSourceData = {
  cronjobsource: {
    data: '',
    schedule: '* * * * *',
  },
  pingsource: {
    data: '',
    schedule: '* * * * *',
  },
  apiserversource: {
    mode: '',
    serviceAccountName: '',
    resources: [
      {
        apiVersion: 'v1',
        kind: 'Event',
      },
    ],
  },
  kafkasource: {
    bootstrapServers: ['my-cluster-kafka-bootstrap.kafka:9092'],
    topics: ['knative-demo-topic'],
    consumerGroup: 'knative-group',
    net: {
      sasl: {
        enable: false,
        user: { secretKeyRef: { name: '', key: '' } },
        password: { secretKeyRef: { name: '', key: '' } },
      },
      tls: {
        enable: false,
        caCert: { secretKeyRef: { name: '', key: '' } },
        cert: { secretKeyRef: { name: '', key: '' } },
        key: { secretKeyRef: { name: '', key: '' } },
      },
    },
    serviceAccountName: '',
  },
  containersource: {
    template: {
      spec: {
        containers: [
          {
            image: 'test-knative-image',
            name: '',
            args: [''],
            env: [],
          },
        ],
      },
    },
  },
};

export const getDefaultEventingData = (typeEventSource: string): EventSourceFormData => {
  const defaultEventingData: EventSourceFormData = {
    project: {
      name: 'mock-project',
      displayName: '',
      description: '',
    },
    apiVersion: 'sources.knative.dev/v1alpha1',
    application: {
      initial: 'mock-app',
      name: 'mock-app',
      selectedKey: 'mock-app',
    },
    name: 'esmyapp',
    sink: {
      knativeService: 'event-display',
    },
    limits: {
      cpu: {
        request: '',
        requestUnit: 'm',
        defaultRequestUnit: 'm',
        limit: '',
        limitUnit: 'm',
        defaultLimitUnit: 'm',
      },
      memory: {
        request: '',
        requestUnit: 'Mi',
        defaultRequestUnit: 'Mi',
        limit: '',
        limitUnit: 'Mi',
        defaultLimitUnit: 'Mi',
      },
    },
    type: typeEventSource,
    data: {
      [typeEventSource.toLowerCase()]: eventSourceData[typeEventSource.toLowerCase()],
    },
    yamlData: '',
  };
  return defaultEventingData;
};

export const getEventSourceDeploymentData = (EventSourceModel: K8sKind): K8sResourceKind => {
  return {
    kind: 'Deployment',
    apiVersion: 'apps/v1',
    metadata: {
      name: 'overlayimage',
      uid: '64b34874-debd-11e9-8cdf-0a0700ae5e38',
      namespace: 'testproject3',
      ownerReferences: [
        {
          apiVersion: `${EventSourceModel.apiGroup}/${EventSourceModel.apiVersion}`,
          kind: EventSourceModel.kind,
          name: 'overlayimage-fdqsffg',
          uid: '1317f615-9636-11e9-b134-06a61d886b689_1',
          controller: true,
          blockOwnerDeletion: true,
        },
      ],
    },
    spec: {
      replicas: 1,
      template: {
        metadata: { creationTimestamp: null, labels: { app: 'hello-openshift' } },
        spec: {
          containers: [
            {
              name: 'hello-openshift',
              image: 'openshift/hello-openshift',
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File',
              imagePullPolicy: 'Always',
            },
          ],
          restartPolicy: 'Always',
          terminationGracePeriodSeconds: 30,
          dnsPolicy: 'ClusterFirst',
          securityContext: {},
          schedulerName: 'default-scheduler',
        },
      },
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: { maxUnavailable: '25%', maxSurge: '25%' },
      },
      revisionHistoryLimit: 10,
      progressDeadlineSeconds: 600,
    },
  };
};
