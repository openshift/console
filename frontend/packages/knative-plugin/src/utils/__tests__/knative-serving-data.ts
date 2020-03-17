import {
  DeployImageFormData,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RevisionModel, EventSourceCronJobModel } from '@console/knative-plugin';
import { EventSourceFormData, EventSources } from '../../components/add/import-types';

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

export const deploymentKnativeEventData: K8sResourceKind = {
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
    ownerReferences: [
      {
        apiVersion: `${EventSourceCronJobModel.apiGroup}/${EventSourceCronJobModel.apiVersion}`,
        kind: EventSourceCronJobModel.kind,
        name: 'overlayimage-fdqsffg',
        uid: '1317f615-9636-11e9-b134-06a61d886b689',
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
};

const eventSourceData = {
  cronjobsource: {
    data: 'hello',
    schedule: '* * * * *',
  },
};

const typeEventSource = EventSources.CronJobSource;

export const defaultEventingData: EventSourceFormData = {
  project: {
    name: 'mock-project',
    displayName: '',
    description: '',
  },
  application: {
    initial: 'mock-app',
    name: 'mock-app',
    selectedKey: 'mock-app',
  },
  name: 'esmyapp',
  sink: {
    knativeService: 'event-display',
  },
  type: typeEventSource,
  data: {
    [typeEventSource.toLowerCase()]: eventSourceData[typeEventSource.toLowerCase()],
  },
};
