import { healthChecksProbeInitialData } from '@console/dev-console/src/components/health-checks/health-checks-probe-utils';
import {
  DeployImageFormData,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import { K8sResourceKind, K8sKind, apiVersionForModel } from '@console/internal/module/k8s';
import {
  EventSourceSyncFormData,
  SinkType,
  AddChannelFormData,
  EventSources,
} from '../../components/add/import-types';
import { RevisionModel, ServiceModel, KafkaModel } from '../../models';
import { getChannelKind, getChannelData } from '../create-channel-utils';

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
  allowInsecureRegistry: false,
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
  runtimeIcon: null,
  isSearchingForImage: false,
  resources: Resources.OpenShift,
  serverless: {
    scaling: {
      minpods: 1,
      maxpods: 5,
      concurrencytarget: 1,
      concurrencylimit: 1,
      autoscale: {
        autoscalewindow: 6,
        autoscalewindowUnit: 's',
        defaultAutoscalewindowUnit: 's',
      },
      concurrencyutilization: 70,
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
  fileUpload: {
    name: 'python',
    value: '',
    javaArgs: '',
  },
  healthChecks: healthChecksProbeInitialData,
};

export const deploymentData: K8sResourceKind = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: { 'deployment.kubernetes.io/revision': '1' },
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

export const hpaData: K8sResourceKind = {
  kind: 'HorizontalPodAutoscaler',
  apiVersion: 'autoscaling/v2beta2',
  metadata: {
    name: 'example',
    namespace: 'testproject3',
    uid: 'c5c6e70e-5a95-4851-9027-ece28739378a',
    resourceVersion: '36526',
    creationTimestamp: '2021-03-25T05:23:38Z',
  },
  spec: {
    scaleTargetRef: { kind: 'Deployment', name: 'overlayimage', apiVersion: 'apps/v1' },
    minReplicas: 1,
    maxReplicas: 3,
    metrics: [
      {
        type: 'Resource',
        resource: { name: 'memory', target: { type: 'Utilization', averageUtilization: 70 } },
      },
      {
        type: 'Resource',
        resource: { name: 'cpu', target: { type: 'Utilization', averageUtilization: 70 } },
      },
    ],
  },
  status: {
    currentReplicas: 1,
    desiredReplicas: 1,
    currentMetrics: [
      {
        type: 'Resource',
        resource: { name: 'memory', current: { averageValue: '1630208', averageUtilization: 0 } },
      },
      {
        type: 'Resource',
        resource: { name: 'cpu', current: { averageValue: '0', averageUtilization: 0 } },
      },
    ],
    conditions: [
      {
        type: 'AbleToScale',
        status: 'True',
        lastTransitionTime: '2021-03-25T05:23:53Z',
        reason: 'ReadyForNewScale',
        message: 'recommended size matches current size',
      },
      {
        type: 'ScalingActive',
        status: 'True',
        lastTransitionTime: '2021-03-25T05:24:23Z',
        reason: 'ValidMetricFound',
        message:
          'the HPA was able to successfully calculate a replica count from cpu resource utilization (percentage of request)',
      },
      {
        type: 'ScalingLimited',
        status: 'True',
        lastTransitionTime: '2021-03-25T05:28:54Z',
        reason: 'TooFewReplicas',
        message: 'the desired replica count is less than the minimum replica count',
      },
    ],
  },
};

export const deploymentKnativeData: K8sResourceKind = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: { 'deployment.kubernetes.io/revision': '1' },
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
  [EventSources.CronJobSource]: {
    data: '',
    schedule: '* * * * *',
  },
  [EventSources.PingSource]: {
    jsonData: '',
    schedule: '* * * * *',
  },
  [EventSources.ApiServerSource]: {
    mode: '',
    serviceAccountName: '',
    resources: [
      {
        apiVersion: 'v1',
        kind: 'Event',
      },
    ],
  },
  [EventSources.KafkaSource]: {
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
  [EventSources.ContainerSource]: {
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

export const getDefaultEventingData = (typeEventSource: string): EventSourceSyncFormData => {
  const defaultEventingData: EventSourceSyncFormData = {
    editorType: 'form',
    formData: {
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
      sinkType: SinkType.Resource,
      sink: {
        apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
        name: 'event-display',
        kind: ServiceModel.kind,
        key: `${ServiceModel.kind}-event-display`,
      },
      type: typeEventSource,
      data: {
        [typeEventSource]: eventSourceData[typeEventSource],
      },
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

export const Kafkas: K8sResourceKind[] = [
  {
    apiVersion: apiVersionForModel(KafkaModel),
    kind: KafkaModel.kind,
    metadata: {
      creationTimestamp: '2020-07-06T16:43:44Z',
      generation: 1,
      name: 'my-cluster',
      namespace: 'div',
      resourceVersion: '142204',
      uid: '56c871cf-e649-4c7e-8ac6-8fafc933c96f',
    },
    spec: {
      kafka: {
        config: {
          'log.message.format.version': '2.5',
          'offsets.topic.replication.factor': 3,
          'transaction.state.log.min.isr': 2,
          'transaction.state.log.replication.factor': 3,
        },
        listeners: {
          plain: {},
          tls: {},
        },
        replicas: 3,
        storage: {
          type: 'ephemeral',
        },
        version: '2.5.0',
      },
      zookeeper: {
        replicas: 3,
        storage: {
          type: 'ephemeral',
        },
      },
    },
    status: {
      conditions: [
        {
          lastTransitionTime: '2020-07-06T16:45:13+0000',
          status: 'True',
          type: 'Ready',
        },
      ],
      listeners: [
        {
          addresses: [
            {
              host: 'my-cluster-kafka-bootstrap.div.svc',
              port: 9092,
            },
          ],
          bootstrapServers: 'my-cluster-kafka-bootstrap.div.svc:9092',
          type: 'plain',
        },
        {
          addresses: [
            {
              host: 'my-cluster-kafka-bootstrap.div.svc',
              port: 9093,
            },
          ],
          bootstrapServers: 'my-cluster-kafka-bootstrap.div.svc:9093',
          certificates: [
            '-----BEGIN CERTIFICATE-----\nMIIDLTCCAhWgAwIBAgIJAKdAmIkaXSmiMA0GCSqGSIb3DQEBCwUAMC0xEzARBgNV\nBAoMCmlvLnN0cmltemkxFjAUBgNVBAMMDWNsdXN0ZXItY2EgdjAwHhcNMjAwNzA2\nMTY0MzQ0WhcNMjEwNzA2MTY0MzQ0WjAtMRMwEQYDVQQKDAppby5zdHJpbXppMRYw\nFAYDVQQDDA1jbHVzdGVyLWNhIHYwMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB\nCgKCAQEAp0yDYlEHNPChuaNVBqZMTpYGfNe+FvHoyp3oB6bsErsl5SjCTTs5rkfK\nMT/vfEI7vmuaAvtSktJKKrZrDY/L4tJkf7IaJGAf5Jfgr2UEAmfzZHR2JTx+kODF\n1Q5PI3pH/ENjof6i686UE9VCovCifLiWuZaLaaYFoadVKnDJMPUyQvSr6zBbwCKO\n4jUM2MRMKabAhvlUricmTXX/1y4+26UIzmad2jG2bLZr+vrHDtc+HfkuJXl/4lD/\nm9TMN/Ab08aNFvF9dorg9hgxoL/tE4J8TRJp9wB5oF0BfU0B9JZ5ML+nvWMTF8no\nEYlejBHvmnUaBEecEZ0C3GKm4CFABwIDAQABo1AwTjAdBgNVHQ4EFgQUGign3S8T\n+p2ABHBE+ASURZZ0GsQwHwYDVR0jBBgwFoAUGign3S8T+p2ABHBE+ASURZZ0GsQw\nDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAJpkcJO5y9h5zRGkQ1+Pr\n8Y9+qPZnQeFCYIFmtT7eX+1/64anDnK8i3ZPy2GyQvxFazGPLRzaUpFr/fRDcw05\ntNRAIhet6cKQYgZBGJo4QPCE6XTZrPI9tf7xG/otJczQtsDNxkxfxJ3AGVdKkbw7\nst1gAFJncoDWyie5I9LiR8rr7OjAgbECKRePbjxbYmb3rIkaecARPiOiOOfEdwB+\nWOPSSTc5L1Wtf00pQ1jtnpnFgh9s5xHoATWjm0kr2uKSEd7Jwikf1HNLEjNlOdpD\njSavbHxKaQXxbs2e+z5RNqsGi6LgZs6tEni3j9zadX2KoXgrlxn9ZrK90e8E1Pdg\ndw==\n-----END CERTIFICATE-----\n',
          ],
          type: 'tls',
        },
      ],
      observedGeneration: 1,
    },
  },
  {
    apiVersion: apiVersionForModel(KafkaModel),
    kind: KafkaModel.kind,
    metadata: {
      creationTimestamp: '2020-07-06T16:56:39Z',
      generation: 1,
      name: 'my-cluster2',
      namespace: 'div',
      resourceVersion: '152566',
      uid: '219842be-00df-4e30-9c15-fce4b7438244',
    },
    spec: {
      kafka: {
        config: {
          'log.message.format.version': '2.5',
          'offsets.topic.replication.factor': 3,
          'transaction.state.log.min.isr': 2,
          'transaction.state.log.replication.factor': 3,
        },
        listeners: {
          plain: {},
          tls: {},
        },
        replicas: 3,
        storage: {
          type: 'ephemeral',
        },
        version: '2.5.0',
      },
      zookeeper: {
        replicas: 3,
        storage: {
          type: 'ephemeral',
        },
      },
    },
    status: {
      conditions: [
        {
          lastTransitionTime: '2020-07-06T16:57:34+0000',
          status: 'True',
          type: 'Ready',
        },
      ],
      listeners: [
        {
          addresses: [
            {
              host: 'my-cluster2-kafka-bootstrap.div.svc',
              port: 9092,
            },
          ],
          bootstrapServers: 'my-cluster2-kafka-bootstrap.div.svc:9092',
          type: 'plain',
        },
        {
          addresses: [
            {
              host: 'my-cluster2-kafka-bootstrap.div.svc',
              port: 9093,
            },
          ],
          bootstrapServers: 'my-cluster2-kafka-bootstrap.div.svc:9093',
          certificates: [
            '-----BEGIN CERTIFICATE-----\nMIIDLTCCAhWgAwIBAgIJAM5D3NjoJTpcMA0GCSqGSIb3DQEBCwUAMC0xEzARBgNV\nBAoMCmlvLnN0cmltemkxFjAUBgNVBAMMDWNsdXN0ZXItY2EgdjAwHhcNMjAwNzA2\nMTY1NjQwWhcNMjEwNzA2MTY1NjQwWjAtMRMwEQYDVQQKDAppby5zdHJpbXppMRYw\nFAYDVQQDDA1jbHVzdGVyLWNhIHYwMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB\nCgKCAQEA4VPNI9879XEQ6ZNRVLOtP9FeUfkbdvxfSYqat1mT/BIV+gO/UlYbVpuq\nr19D3hBLja2q0skJAP0id0alX48f2UErXHumLZwz+4rpuZWToKqaTPp/0RTFv0d8\nDdDGweyysIyj5+MY2sRDQISXVg/3sUe5IIuJTWlAibgStcKq8wQYsbijLRx+2/GP\nUIALGJBU6vazyMo7do90AJoZ1YzG/n7mX3UYqpVy8qbJ47HkfQO8I/swS6+gEgp0\nyE+zKo41eUpX/ZMXLFIpry+I8xwBaTN7/Oc1kmTvODSvEKjmjtK0B9jhAwbrZk9u\nyLEqw9VTz1c1/70qpRg399RF8mFV4wIDAQABo1AwTjAdBgNVHQ4EFgQUUVDhyMRG\nbkUeL9+XddzQwUq5cr4wHwYDVR0jBBgwFoAUUVDhyMRGbkUeL9+XddzQwUq5cr4w\nDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAh7lwMOXzocBKx9HfdHou\neyL26gsF/bUpn01X0kmkEMpdj0a+FfeEXlPiH8AUQlbPjAaOIICHj8IeSM4T8/4c\n/qT0q4BZU81A4X05jHUijEEPQ5fRvmjdY2qkDUT5hOeHOQRfVXgwnBzNDykzNq4K\n6MIEwyz7PhvKUgsJ/f6j/KpHyxN2dJLTx+PaxWorRY5eiajnqZ+4WmnVPcPID8ax\nd3lChMhC3eGZiBv8/OtXZKeBF4ChTOdbfYS3jx8fElc0GkbLk56SyHMVtjRkGsON\n34tNqjz8rHQ0AGineJ72YtGR5DJzWvll09cVtXFBTL+6LYVCQYqSB9/gzXyAtUjb\nHw==\n-----END CERTIFICATE-----\n',
          ],
          type: 'tls',
        },
      ],
      observedGeneration: 1,
    },
  },
  {
    apiVersion: 'rhoas.redhat.com/v1alpha1',
    kind: 'KafkaConnection',
    metadata: {
      resourceVersion: '8324966',
      name: 'ajay-test',
      uid: 'bc6c508f-0167-48a3-9a13-96f2aeb7aff2',
      creationTimestamp: '2021-03-30T08:28:59Z',
      generation: 1,
      namespace: 'div',
      finalizers: ['kafkaconnections.rhoas.redhat.com/finalizer'],
    },
    spec: {
      accessTokenSecretName: 'rh-cloud-services-api-accesstoken',
      credentials: {
        serviceAccountSecretName: 'rh-cloud-services-service-account',
      },
      kafkaId: '1qCXzgiGqva0D5bXIB0Gn9g23Ni',
    },
    status: {
      bootstrapServerHost: 'jai-test--qcxzgigqva-d-bxib-gn-g--ni.kafka.devshift.org:443',
      conditions: [
        {
          lastTransitionGeneration: 1,
          lastTransitionTime: '2021-03-30T08:29:00.092273Z',
          message: '',
          reason: '',
          status: 'True',
          type: 'AcccesTokenSecretValid',
        },
        {
          lastTransitionGeneration: 1,
          lastTransitionTime: '2021-03-30T08:29:00.092277Z',
          message: '',
          reason: '',
          status: 'True',
          type: 'FoundKafkaById',
        },
        {
          lastTransitionGeneration: 1,
          lastTransitionTime: '2021-03-30T08:29:00.092278Z',
          message: '',
          reason: '',
          status: 'True',
          type: 'Finished',
        },
      ],
      message: 'Created',
      metadata: {
        cloudUI:
          'https://cloud.redhat.com/beta/application-services/openshift-streams/kafkas/1qCXzgiGqva0D5bXIB0Gn9g23Ni',
        provider: 'rhoas',
        saslMechanism: 'PLAIN',
        securityProtocol: 'SASL_SSL',
        type: 'kafka',
      },
      serviceAccountSecretName: 'rh-cloud-services-service-account',
      updated: '2021-03-30T08:29:00.092250Z',
    },
  },
];

export const getDefaultChannelData = (ref: string): AddChannelFormData => {
  const kind = getChannelKind(ref);
  return {
    application: {
      initial: 'app-group-one',
      name: 'app-group-one',
      selectedKey: 'app-group-one',
    },
    name: '',
    namespace: 'channel-ns',
    apiVersion: '',
    type: ref,
    data: {
      [kind.toLowerCase()]: getChannelData(getChannelKind(ref).toLowerCase()),
    },
    yamlData: '',
  };
};
