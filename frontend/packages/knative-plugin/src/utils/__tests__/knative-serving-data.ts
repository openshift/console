import { K8sResourceKind, K8sKind, apiVersionForModel } from '@console/internal/module/k8s';
import {
  DeployImageFormData,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import {
  EventSourceFormData,
  SinkType,
  AddChannelFormData,
  NormalizedEventSources,
  EventSources,
} from '../../components/add/import-types';
import { ClusterServiceVersionKind, InstallModeType } from '@console/operator-lifecycle-manager';
import { RevisionModel, ServiceModel, KafkaModel } from '../../models';
import { healthChecksProbeInitialData } from '@console/dev-console/src/components/health-checks/health-checks-probe-utils';
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
      selfLink: '/apis/kafka.strimzi.io/v1beta1/namespaces/div/kafkas/my-cluster',
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
      selfLink: '/apis/kafka.strimzi.io/v1beta1/namespaces/div/kafkas/my-cluster2',
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
];

export const eventSourcesObj: NormalizedEventSources = {
  CamelSource: {
    name: 'CamelSource',
    iconUrl: 'static/assets/camelsource.svg',
    displayName: 'Camel Source',
    title: 'Camel Source',
  },
  PingSource: {
    name: 'PingSource',
    iconUrl: 'static/assets/pingsource.png',
    displayName: 'Ping Source',
    title: 'Ping Source',
  },
  ApiServerSource: {
    name: 'ApiServerSource',
    iconUrl: 'static/assets/apiserversource.png',
    displayName: 'Api Server Source',
    title: 'Api Server Source',
  },
  GitHubSource: {
    name: 'GitHubSource',
    iconUrl: 'static/assets/github.png',
    displayName: 'Api Server Source',
    title: 'Api Server Source',
  },
  jira: {
    name: 'jira',
    iconUrl: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbm',
    displayName: 'Camel Source',
    title: 'Camel Source',
    data: {
      almdata: {
        apiVersion: 'sources.knative.dev/v1alpha1',
        kind: 'CamelSource',
        metadata: { name: 'jira' },
        spec: {},
      },
    },
  },
};

export const camelCsvData: ClusterServiceVersionKind[] = [
  {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'ClusterServiceVersion',
    metadata: {
      annotations: {
        certified: 'false',
        repository: 'https://github.com/knative/eventing-sources',
        support: 'Camel',
        'alm-examples':
          '[\n  {\n    "apiVersion": "sources.knative.dev/v1alpha1",\n    "kind": "CamelSource",\n    "metadata": {\n      "name": "camel-timer-source"\n    },\n    "spec": {\n      "source": {\n        "flow": {\n          "from": {\n            "uri": "timer:tick?period=3000",\n            "steps": [\n              {\n                "set-body": {\n                  "constant": "Hello World!"\n                }\n              }\n            ]\n          }\n        }\n      },\n      "sink": {\n        "ref": {\n          "apiVersion": "messaging.knative.dev/v1beta1",\n          "kind": "InMemoryChannel",\n          "name": "camel-test"\n        }\n      }\n    }\n  },\n  {"apiVersion": "sources.knative.dev/v1alpha1", "kind": "CamelSource", "metadata": {"name": "telegram", "labels": {"console.openshift.io/event-source": "true"}, "annotations": {"console.openshift.io/icon": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgMjQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIuNjY3IiB4Mj0iLjQxNyIgeTE9Ii4xNjciIHkyPSIuNzUiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzM3YWVlMiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFlOTZjOCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iLjY2IiB4Mj0iLjg1MSIgeTE9Ii40MzciIHkyPSIuODAyIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNlZmY3ZmMiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIxMjAiIGN5PSIxMjAiIHI9IjEyMCIgZmlsbD0idXJsKCNhKSIvPjxwYXRoIGZpbGw9IiNjOGRhZWEiIGQ9Ik05OCAxNzVjLTMuODg4IDAtMy4yMjctMS40NjgtNC41NjgtNS4xN0w4MiAxMzIuMjA3IDE3MCA4MCIvPjxwYXRoIGZpbGw9IiNhOWM5ZGQiIGQ9Ik05OCAxNzVjMyAwIDQuMzI1LTEuMzcyIDYtM2wxNi0xNS41NTgtMTkuOTU4LTEyLjAzNSIvPjxwYXRoIGZpbGw9InVybCgjYikiIGQ9Ik0xMDAuMDQgMTQ0LjQxbDQ4LjM2IDM1LjcyOWM1LjUxOSAzLjA0NSA5LjUwMSAxLjQ2OCAxMC44NzYtNS4xMjNsMTkuNjg1LTkyLjc2M2MyLjAxNS04LjA4LTMuMDgtMTEuNzQ2LTguMzYtOS4zNDlsLTExNS41OSA0NC41NzFjLTcuODkgMy4xNjUtNy44NDMgNy41NjctMS40MzggOS41MjhsMjkuNjYzIDkuMjU5IDY4LjY3My00My4zMjVjMy4yNDItMS45NjYgNi4yMTgtLjkxIDMuNzc2IDEuMjU4Ii8+PC9zdmc+"}}, "spec": {"source": {"flow": {"from": {"uri": "telegram:bots", "parameters": {"authorizationToken": "<put-here-the-token-from-the-bot-father>"}, "steps": [{"marshal": {"json": {}}}, {"to": "log:info"}]}}, "integration": {"dependencies": ["camel:jackson"]}}, "sink": {"ref": {"apiVersion": "messaging.knative.dev/v1beta1", "kind": "InMemoryChannel", "name": "messages"}}}},\n  {"apiVersion": "sources.knative.dev/v1alpha1", "kind": "CamelSource", "metadata": {"name": "salesforce", "labels": {"console.openshift.io/event-source": "true"}, "annotations": {"console.openshift.io/icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZpZXdCb3g9IjAgMCA0OCA0OCIgdmVyc2lvbj0iMS4xIj48ZyBpZD0ic3VyZmFjZTEiPjxwYXRoIGQ9Ik0zNi41IDEyYy0xLjMyNCAwLTIuNTkuMjU4LTMuNzU4LjcwM0E3Ljk5NCA3Ljk5NCAwIDAgMCAyNiA5Yy0yLjEwNSAwLTQuMDIuODItNS40NDUgMi4xNTJBOS40NjggOS40NjggMCAwIDAgMTMuNSA4QzguMjU0IDggNCAxMi4yNTQgNCAxNy41YzAgLjc5My4xMSAxLjU1OS4yOSAyLjI5M0E4LjQ3MiA4LjQ3MiAwIDAgMCAxIDI2LjVDMSAzMS4xOTUgNC44MDUgMzUgOS41IDM1Yy40MTQgMCAuODE2LS4wNCAxLjIxNS0uMDk4IDEuMzEyIDMgNC4zIDUuMDk4IDcuNzg1IDUuMDk4IDMuMTYgMCA1LjkxNC0xLjczIDcuMzc5LTQuMjkzQTcuOTIzIDcuOTIzIDAgMCAwIDI4IDM2YzIuNjIxIDAgNC45MzgtMS4yNjYgNi4zOTgtMy4yMS42OC4xMzYgMS4zODMuMjEgMi4xMDIuMjFDNDIuMyAzMyA0NyAyOC4zIDQ3IDIyLjVTNDIuMyAxMiAzNi41IDEyeiIgZmlsbD0iIzAzOUJFNSIvPjxwYXRoIGQ9Ik0xNS44MjQgMjVjLjA0MyAwIC4wNzQtLjAzNS4wNzQtLjA4MiAwIC4wNDctLjAzLjA4Mi0uMDc0LjA4MnoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMjEuNTA0IDIzLjkzNHoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNNy4xMzcgMjMuOTNhLjExNi4xMTYgMCAwIDEgLjAwNCAwaC0uMDA0eiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0yNC4xMjUgMjEuOTFjLS4wMTYuMDQtLjA0Ny4wNDMtLjA3LjA0M2guMDA4Yy4wMjMgMCAuMDUtLjAwOC4wNjItLjA0M3oiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMTUuODI0IDE5Yy4wNDMgMCAuMDc0LjAzNS4wNzQuMDgyIDAtLjA0Ny0uMDMtLjA4Mi0uMDc0LS4wODJ6IiBmaWxsPSIjRkZGIi8+PHBhdGggZD0iTTIxLjM2IDIyLjE4NGMwIC40MS4yMS42NjQuNTAzLjgzNi0uMjkzLS4xNzItLjUwNC0uNDI2LS41MDQtLjgzNnoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzguMTI1IDI0LjczYy4wMjcuMDYtLjAzMS4wODYtLjAzMS4wODZzLjA1OC0uMDI3LjAzMS0uMDg2eiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik04LjU1OSAyMXoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNOS43NjYgMjEuOTFjLS4wMi4wNC0uMDQ3LjA0My0uMDc1LjA0M0g5LjdjLjAyOCAwIC4wNTEtLjAwOC4wNjctLjA0M3oiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzUuMTk1IDI0LjE2NHoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzcuODI4IDIxLjc5N2gtLjAyM3MuMDA4LjAwNC4wMjMuMDA0di0uMDA0eiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0zNy44MzIgMjQuMTg4cy4wMTYgMCAuMDM1LS4wMDRoLS4wMDRjLS4wMTUgMC0uMDMxLjAwMy0uMDMxLjAwM3oiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNNi44ODcgMjQuNDZjLS4wMzIuMDcxLjAwOC4wODcuMDIuMDk5LjA4NS4wNTguMTcxLjA5Ny4yNjEuMTQ0LjQ2OS4yMy45MS4yOTcgMS4zNzUuMjk3Ljk0NSAwIDEuNTMxLS40NiAxLjUzMS0xLjIwN3YtLjAxNmMwLS42ODctLjY2NC0uOTM3LTEuMjg1LTEuMTE3bC0uMDc4LS4wMjNjLS40NjktLjE0LS44NzEtLjI2Mi0uODcxLS41NDd2LS4wMTZjMC0uMjQyLjIzNC0uNDIyLjYwMS0uNDIyLjQwNyAwIC44ODcuMTI1IDEuMi4yODUgMCAwIC4wOS4wNTUuMTI1LS4wMjcuMDE1LS4wNDMuMTc1LS40MzMuMTkxLS40NzYuMDItLjA0My0uMDE2LS4wNzktLjA0Ny0uMDk4QTIuODQ1IDIuODQ1IDAgMCAwIDguNTYgMjFoLS4wOTRjLS44NjMgMC0xLjQ2OS40OC0xLjQ2OSAxLjE3MnYuMDEyYzAgLjcyNi42NjQuOTY0IDEuMjkgMS4xMjhsLjEuMDI4Yy40NTQuMTI5Ljg0NC4yMzguODQ0LjUzMXYuMDE2YzAgLjI3LS4yNTMuNDcyLS42NjQuNDcyLS4xNiAwLS42NjgtLjAwNC0xLjIxNC0uMzI0YTIuNDUgMi40NSAwIDAgMS0uMTU3LS4wOWMtLjAyNy0uMDE1LS4wOTMtLjA0My0uMTI1LjA0eiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0yMS4yNDYgMjQuNDZjLS4wMjcuMDcxLjAxMi4wODcuMDIuMDk5LjA5LjA1OC4xNzUuMDk3LjI2MS4xNDQuNDcuMjMuOTE0LjI5NyAxLjM4LjI5Ny45NCAwIDEuNTI3LS40NiAxLjUyNy0xLjIwN3YtLjAxNmMwLS42ODctLjY2LS45MzctMS4yODItMS4xMTdsLS4wODItLjAyM2MtLjQ2NS0uMTQtLjg3LS4yNjItLjg3LS41NDd2LS4wMTZjMC0uMjQyLjIzOC0uNDIyLjYwNS0uNDIyLjQwNiAwIC44ODYuMTI1IDEuMTk5LjI4NSAwIDAgLjA5LjA1NS4xMjUtLjAyNy4wMTYtLjA0My4xNzItLjQzMy4xOTEtLjQ3Ni4wMTYtLjA0My0uMDE1LS4wNzktLjA0Ny0uMDk4QTIuODU3IDIuODU3IDAgMCAwIDIyLjkyMiAyMWgtLjA5OGMtLjg2MyAwLTEuNDY1LjQ4LTEuNDY1IDEuMTcydi4wMTJjMCAuNzI2LjY2NC45NjQgMS4yOSAxLjEyOGwuMDk3LjAyOGMuNDU3LjEyOS44NDguMjM4Ljg0OC41MzF2LjAxNmMwIC4yNy0uMjU0LjQ3Mi0uNjY0LjQ3Mi0uMTYgMC0uNjY4LS4wMDQtMS4yMTUtLjMyNGEyLjQ1IDIuNDUgMCAwIDEtLjE1Ni0uMDljLS4wMi0uMDA4LS4wOTgtLjAzOS0uMTI1LjA0eiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0zMS40NjUgMjIuMjE5YTEuNzE0IDEuNzE0IDAgMCAwLS4zNi0uNjMzIDEuNzQgMS43NCAwIDAgMC0uNjAxLS40MyAyLjE4NyAyLjE4NyAwIDAgMC0uODQ4LS4xNTZjLS4zMTYgMC0uNjAxLjA1NS0uODQzLjE1NmExLjY3IDEuNjcgMCAwIDAtLjYwMi40M2MtLjE2NC4xNzYtLjI4MS4zOS0uMzYuNjMzYTIuNTQ0IDIuNTQ0IDAgMCAwLS4xMTcuNzg1YzAgLjI3Ny4wNC41NDMuMTE4Ljc4NWExLjY5MSAxLjY5MSAwIDAgMCAuOTYgMS4wNTljLjI0My4wOTcuNTI4LjE1Mi44NDQuMTUyLjMyIDAgLjYwNi0uMDUuODQ4LS4xNTIuMjM4LS4xMDIuNDQxLS4yNDYuNjAxLS40MjIuMTYtLjE4LjI4Mi0uMzk1LjM2LS42MzcuMDc4LS4yNDIuMTE3LS41MDQuMTE3LS43ODVzLS4wMzktLjU0My0uMTE3LS43ODVtLS43OS43ODVjMCAuNDIyLS4wODEuNzU4LS4yNS45OTItLjE2Ny4yMzQtLjQxNy4zNDgtLjc2OS4zNDgtLjM0NyAwLS41OTctLjExNC0uNzYxLS4zNDgtLjE2OC0uMjM0LS4yNS0uNTctLjI1LS45OTIgMC0uNDIyLjA4NS0uNzU4LjI1LS45ODguMTY0LS4yMzUuNDE0LS4zNDQuNzYxLS4zNDQuMzUyIDAgLjYwMi4xMS43Ny4zNDQuMTY4LjIzLjI1LjU2Ni4yNS45ODgiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzcuOTM0IDI0LjIzNGMtLjAyOC0uMDc0LS4xMDItLjA0Ny0uMTAyLS4wNDdhMS43NDMgMS43NDMgMCAwIDEtLjM2Ny4wOTggMi44OCAyLjg4IDAgMCAxLS40My4wMzFjLS4zODMgMC0uNjgzLS4xMDUtLjkwMi0uMzEyLS4yMTUtLjIxMS0uMzM2LS41NDctLjMzNi0xIDAtLjQxNC4xMS0uNzI3LjMtLjk2NS4xOTItLjIzNC40ODUtLjM1NS44NzYtLjM1NS4zMjQgMCAuNTc0LjAzNS44MzIuMTA5IDAgMCAuMDYyLjAyNy4wOS0uMDUuMDctLjE3Ny4xMi0uMzAyLjE5NS0uNDk3LjAyLS4wNTgtLjAzMS0uMDgyLS4wNS0uMDg2YTMuMjQgMy4yNCAwIDAgMC0uNTI0LS4xMjUgNC40MzUgNC40MzUgMCAwIDAtLjU5LS4wMzVjLS4zMzIgMC0uNjI1LjA1NS0uODguMTU2YTEuODQyIDEuODQyIDAgMCAwLS42MzYuNDI2Yy0uMTY4LjE4LS4yOTcuMzk1LS4zODMuNjM3YTIuMzE1IDIuMzE1IDAgMCAwLS4xMjkuNzg1YzAgLjYwNS4xNzYgMS4wOTQuNTI4IDEuNDUzLjM0Ny4zNi44Ny41NDMgMS41NTQuNTQzLjQwMyAwIC44MTctLjA3NCAxLjExNC0uMTg0IDAgMCAuMDU4LS4wMjcuMDM1LS4wODZ6IiBmaWxsPSIjRkZGIi8+PHBhdGggZD0iTTQxLjk2NSAyMi4wODJhMS41MiAxLjUyIDAgMCAwLS4zNDQtLjU3OCAxLjUxNiAxLjUxNiAwIDAgMC0uNTA0LS4zNiAyLjEwNSAyLjEwNSAwIDAgMC0uNzY1LS4xNDRjLS4zMzIgMC0uNjMzLjA1LS44OC4xNi0uMjQ1LjEwNi0uNDUyLjI1LS42MTMuNDM0LS4xNjQuMTgtLjI4NS4zOTgtLjM2My42NGEyLjYwNSAyLjYwNSAwIDAgMC0uMTE3Ljc5YzAgLjI4NS4wNDMuNTUuMTIxLjc5Mi4wODIuMjM5LjIxLjQ1NC4zODcuNjMuMTc1LjE3NS40MDIuMzEyLjY3Mi40MS4yNjUuMDk3LjU5My4xNDguOTY4LjE0NC43NyAwIDEuMTc2LS4xNiAxLjM0LS4yNDYuMDMxLS4wMTYuMDU5LS4wNDMuMDI0LS4xMTdsLS4xNzItLjQ1M2MtLjAyOC0uMDctLjEwMi0uMDQzLS4xMDItLjA0My0uMTkxLjA2Mi0uNDYuMTgzLTEuMDk0LjE4LS40MTQgMC0uNzIyLS4xMS0uOTE0LS4yOS0uMTk1LS4xOC0uMjkzLS40NDUtLjMwOC0uODJoMi42NjRzLjA3IDAgLjA3OC0uMDY2Yy4wMDQtLjAyOC4wOS0uNTA4LS4wNzgtMS4wNjNtLTIuNjUzLjUxNmMuMDM2LS4yMzUuMTA2LS40MzQuMjE1LS41ODIuMTY0LS4yMzUuNDEtLjM2Ljc2Mi0uMzYuMzUyIDAgLjU4Mi4xMjUuNzQ2LjM2LjExLjE1Mi4xNi4zNTUuMTguNTgyeiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0yMC40NTMgMjIuMDgyYTEuNTE3IDEuNTE3IDAgMCAwLS4zNC0uNTc4IDEuNDkgMS40OSAwIDAgMC0uNTA4LS4zNiAyLjA4MyAyLjA4MyAwIDAgMC0uNzYxLS4xNDRjLS4zMzIgMC0uNjM3LjA1LS44ODMuMTYtLjI0Mi4xMDYtLjQ1LjI1LS42MTMuNDM0YTEuNzggMS43OCAwIDAgMC0uMzYuNjQgMi42MDUgMi42MDUgMCAwIDAtLjExNy43OWMwIC4yODUuMDQuNTUuMTIxLjc5Mi4wNzguMjM5LjIxMS40NTQuMzg3LjYzLjE3Ni4xNzUuMzk4LjMxMi42NjguNDEuMjcuMDk3LjU5NC4xNDguOTY5LjE0NC43NyAwIDEuMTc1LS4xNiAxLjM0My0uMjQ2LjAzMi0uMDE2LjA1NS0uMDQzLjAyNC0uMTE3bC0uMTc2LS40NTNjLS4wMjctLjA3LS4xMDItLjA0My0uMTAyLS4wNDMtLjE5LjA2Mi0uNDYuMTgzLTEuMDkzLjE4LS40MTQgMC0uNzE5LS4xMS0uOTEtLjI5LS4yLS4xOC0uMjk3LS40NDUtLjMxMy0uODJoMi42NjhzLjA3IDAgLjA3OC0uMDY2YzAtLjAyOC4wOS0uNTA4LS4wODItMS4wNjNtLTIuNjUyLjUxNmMuMDM5LS4yMzUuMTEtLjQzNC4yMTUtLjU4Mi4xNjQtLjIzNS40MTQtLjM2Ljc2NS0uMzYuMzQ4IDAgLjU3OC4xMjUuNzQ2LjM2LjExLjE1Mi4xNi4zNTUuMTc2LjU4MnoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMTIuOTMgMjIuNDhjLS4xMS0uMDAzLS4yNDYtLjAwNy0uNDE0LS4wMDctLjIzIDAtLjQ1NC4wMjMtLjY2LjA3OC0uMjA4LjA1LS4zOTUuMTI5LS41NTUuMjM4LS4xNi4xMDYtLjI5My4yNDItLjM4Ny40MDZhMS4xMzUgMS4xMzUgMCAwIDAtLjE0NC41N2MwIC4yMi4wNDMuNDEuMTI1LjU2My4wNzguMTU2LjE5NS4yODUuMzQzLjM4Ny4xNDkuMTAxLjMzMi4xNzYuNTQzLjIxOS4yMTEuMDQzLjQ1LjA2Ni43MTEuMDY2LjI3NCAwIC41NDMtLjAyLjgwOS0uMDYzLjI2MS0uMDQyLjU4Mi0uMTAxLjY3Mi0uMTIuMDktLjAyLjE4Ny0uMDQ0LjE4Ny0uMDQ0LjA2Ny0uMDE1LjA1OS0uMDgyLjA1OS0uMDgydi0yLjI1N2MwLS40OTctLjE0NS0uODY0LS40MjItMS4wOTQtLjI4MS0uMjI3LS42OTUtLjM0LTEuMjI3LS4zNC0uMTk5IDAtLjUyLjAyMy0uNzE1LjA2MyAwIDAtLjU4Mi4xMDEtLjgyLjI3NyAwIDAtLjA1NS4wMzEtLjAyMy4wOThsLjE4Ny40NjhjLjAyNC4wNjMuMDg2LjA0My4wODYuMDQzcy4wMjQtLjAwOC4wNDctLjAyM2MuNTEyLS4yNTggMS4xNi0uMjUgMS4xNi0uMjUuMjkgMCAuNTEyLjA1NC42Ni4xNi4xNDUuMTA1LjIyLjI1OC4yMi41OXYuMTA1Yy0uMjMxLS4wMzEtLjQ0Mi0uMDUtLjQ0Mi0uMDVtLTEuMDYzIDEuNzM4YS41MzguNTM4IDAgMCAxLS4xNTItLjE0OS41Ny41NyAwIDAgMS0uMDc4LS4zMmMwLS4yMTkuMDc4LS4zNzEuMjM4LS40NzctLjAwNCAwIC4yMy0uMTg3Ljc3My0uMTguMzguMDA1LjcyMy4wNTUuNzIzLjA1NXYxLjEyNXMtLjM0LjA2Ny0uNzE5LjA4NmMtLjU0My4wMzItLjc4NS0uMTQtLjc4NS0uMTQiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzQuNzYyIDIxLjE2OGMuMDItLjA1OS0uMDI0LS4wODItLjA0My0uMDlhMi41MjYgMi41MjYgMCAwIDAtLjQ0Ni0uMDc0Yy0uMzM2LS4wMi0uNTIuMDM1LS42ODcuMTA1LS4xNjguMDctLjM1Mi4xODgtLjQ1LjMybC0uMDAzLS4zMTJjMC0uMDQzLS4wMzEtLjA3OC0uMDc0LS4wNzhoLS42ODRhLjA3Ni4wNzYgMCAwIDAtLjA3OC4wNzh2My44MDVjMCAuMDQzLjAzOS4wNzguMDgyLjA3OGguN2EuMDguMDggMCAwIDAgLjA4MS0uMDc4di0xLjg5OWMwLS4yNTcuMDI4LS41MTEuMDg2LS42NzFhLjk2NC45NjQgMCAwIDEgLjIzNC0uMzc1Ljg2Ljg2IDAgMCAxIC4zMzMtLjE5MiAxLjM1IDEuMzUgMCAwIDEgLjM1NS0uMDQ3Yy4xNCAwIC4yOTMuMDM1LjI5My4wMzUuMDUuMDA0LjA3OC0uMDI3LjA5OC0uMDcuMDQ2LS4xMTMuMTc1LS40NjUuMjAzLS41MzUiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMjguMjAzIDE5LjEwNWExLjk1IDEuOTUgMCAwIDAtLjYyNS0uMDljLS40ODQgMC0uODYzLjEzNy0xLjEyOS40MDctLjI2NS4yNjUtLjQ0NS42NzYtLjUzOSAxLjIxbC0uMDQ3LjM2NGgtLjYwNXMtLjA3NC0uMDA0LS4wOS4wNzhsLS4wOTguNTU1Yy0uMDA4LjA1NS4wMTYuMDg2LjA4Ni4wODZoLjU5bC0uNTk4IDMuMzM2YTQuNDMgNC40MyAwIDAgMS0uMTYuNjYgMS40MjIgMS40MjIgMCAwIDEtLjE4Ny4zNzkuNTA1LjUwNSAwIDAgMS0uMjQyLjE4NyAxIDEgMCAwIDEtLjMxNy4wNDMuOTcuOTcgMCAwIDEtLjIxLS4wMjMuNTguNTggMCAwIDEtLjE0NS0uMDQzcy0uMDctLjAyNy0uMDk4LjA0M2MtLjAyMy4wNTUtLjE4LjQ4OC0uMTk1LjUzOS0uMDIuMDU1LjAwNC4wOTQuMDM5LjEwNS4wNzguMDMyLjEzNy4wNDcuMjQyLjA3NS4xNDguMDM1LjI3My4wMzUuMzkuMDM1LjI0NyAwIC40Ny0uMDM1LjY1Ny0uMTAyLjE4Ny0uMDY2LjM0OC0uMTgzLjQ5Mi0uMzQ0LjE1Ni0uMTcxLjI1NC0uMzUxLjM0OC0uNTkzLjA5LS4yNDYuMTY4LS41NDcuMjM0LS44OTlsLjU5OC0zLjM5OGguODc5cy4wNzQuMDA0LjA5LS4wNzhsLjA5Ny0uNTU1Yy4wMDgtLjA1LS4wMTUtLjA4Ni0uMDg2LS4wODZoLS44NTFjLjAwNC0uMDIuMDU4LS41MDQuMTU2LS43ODVhLjc4OC43ODggMCAwIDEgLjE4Ny0uMjg1LjU2Ni41NjYgMCAwIDEgLjIyMy0uMTQgMS4xNjUgMS4xNjUgMCAwIDEgLjUwNC0uMDJjLjA4Mi4wMi4xMTcuMDI3LjEzNy4wMzUuMDkuMDI3LjA5NyAwIC4xMTctLjA0M2wuMjAzLS41NTljLjAyMy0uMDU4LS4wMjctLjA4Ni0uMDQ3LS4wOTQiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMTUuODk4IDI0LjkxOGMwIC4wNDctLjAzLjA4Mi0uMDc0LjA4MmgtLjcwN2MtLjA0NyAwLS4wNzgtLjAzNS0uMDc4LS4wODJ2LTUuODM2YzAtLjA0Ny4wMzEtLjA4Mi4wNzgtLjA4MmguNzA3Yy4wNDMgMCAuMDc0LjA0LjA3NC4wODJ6IiBmaWxsPSIjRkZGIi8+PC9nPjxtZXRhZGF0YT48cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnJkZnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDEvcmRmLXNjaGVtYSMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyI+PHJkZjpEZXNjcmlwdGlvbiBhYm91dD0iaHR0cHM6Ly9pY29uc2NvdXQuY29tL2xlZ2FsI2xpY2Vuc2VzIiBkYzp0aXRsZT0ic2FsZXNmb3JjZSIgZGM6ZGVzY3JpcHRpb249InNhbGVzZm9yY2UiIGRjOnB1Ymxpc2hlcj0iSWNvbnNjb3V0IiBkYzpkYXRlPSIyMDE3LTEyLTE1IiBkYzpmb3JtYXQ9ImltYWdlL3N2Zyt4bWwiIGRjOmxhbmd1YWdlPSJlbiI+PGRjOmNyZWF0b3I+PHJkZjpCYWc+PHJkZjpsaT5JY29uczg8L3JkZjpsaT48L3JkZjpCYWc+PC9kYzpjcmVhdG9yPjwvcmRmOkRlc2NyaXB0aW9uPjwvcmRmOlJERj48L21ldGFkYXRhPjwvc3ZnPg=="}}, "spec": {"source": {"flow": {"from": {"uri": "salesforce:camelTestTopic", "parameters": {"notifyForFields": "ALL", "updateTopic": "true", "notifyForOperationCreate": "true", "notifyForOperationUpdate": "false", "notifyForOperationDelete": "false", "notifyForOperationUndelete": "false", "sObjectQuery": "SELECT Id, Name, Email, Phone FROM Contact"}, "steps": [{"to": "log:info"}]}}}, "sink": {"ref": {"apiVersion": "messaging.knative.dev/v1beta1", "kind": "InMemoryChannel", "name": "salesforce"}}}},\n  {"apiVersion":"sources.knative.dev/v1alpha1","kind":"CamelSource","metadata":{"name":"slack","labels":{"console.openshift.io/event-source":"true"},"annotations":{"console.openshift.io/icon":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMyNUQzNjY7fQoJLnN0MXtmaWxsOiNGRkZGRkY7fQoJLnN0MntmaWxsOiNGRjAwMDA7fQoJLnN0M3tmaWxsOiMzRDVBOTg7fQoJLnN0NHtmaWxsOnVybCgjU1ZHSURfMV8pO30KCS5zdDV7ZmlsbDp1cmwoI1NWR0lEXzJfKTt9Cgkuc3Q2e2ZpbGw6IzU1QURFRTt9Cgkuc3Q3e2ZpbGw6IzFFOTZDODt9Cgkuc3Q4e2ZpbGw6I0E5QzlERDt9Cgkuc3Q5e2ZpbGw6I0M4REFFQTt9Cgkuc3QxMHtmaWxsOm5vbmU7fQoJLnN0MTF7ZmlsbDojNDc4N0YzO30KCS5zdDEye2ZpbGw6I0RDNDgzQzt9Cgkuc3QxM3tmaWxsOiNGRkNFNDM7fQoJLnN0MTR7ZmlsbDojMTQ5RjVDO30KCS5zdDE1e2ZpbGw6I0NFMUU1Qjt9Cgkuc3QxNntmaWxsOiM3MkM1Q0Q7fQoJLnN0MTd7ZmlsbDojREZBMjJGO30KCS5zdDE4e2ZpbGw6IzNDQjE4Nzt9Cgkuc3QxOXtmaWxsOiMyNDhDNzM7fQoJLnN0MjB7ZmlsbDojMzkyNTM4O30KCS5zdDIxe2ZpbGw6I0JCMjQyQTt9Cgkuc3QyMntmaWxsOm5vbmU7c3Ryb2tlOiMzQ0IxODc7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQoJLnN0MjN7ZmlsbDojMDA5QTU3O30KCS5zdDI0e2ZpbGw6I0ZDQ0QzNzt9Cgkuc3QyNXtmaWxsOiMyNzcxRjA7fQo8L3N0eWxlPjxnPjxwYXRoIGNsYXNzPSJzdDE1IiBkPSJNNTAxLjgsMjc0TDUwMS44LDI3NGMtNy42LTIzLjMtMzIuNi0zNi4xLTU2LTI4LjVMOTYuMiwzNTkuMWMtMjMuMyw3LjYtMzYuMSwzMi42LTI4LjUsNTZsMCwwICAgYzcuNiwyMy4zLDMyLjYsMzYuMSw1NiwyOC41bDM0OS42LTExMy42QzQ5Ni42LDMyMi40LDUwOS40LDI5Ny4zLDUwMS44LDI3NHoiLz48cGF0aCBjbGFzcz0ic3QxNiIgZD0iTTQ0My41LDk3LjdsLTAuMi0wLjVjLTcuNi0yMy4zLTMyLjYtMzYuMS01Ni0yOC41TDM4LjcsMTgyLjFjLTIzLjMsNy42LTM2LjEsMzIuNi0yOC41LDU2bDAuMiwwLjUgICBjNy42LDIzLjMsMzIuNiwzNi4xLDU2LDI4LjVsMzQ4LjYtMTEzLjNDNDM4LjMsMTQ2LjEsNDUxLDEyMS4xLDQ0My41LDk3Ljd6Ii8+PHBhdGggY2xhc3M9InN0MTciIGQ9Ik00NDMuNiwzODguM0wzMjkuOSwzOC43Yy03LjYtMjMuMy0zMi42LTM2LjEtNTYtMjguNXYwYy0yMy4zLDcuNi0zNi4xLDMyLjYtMjguNSw1NmwxMTMuNiwzNDkuNiAgIGM3LjYsMjMuMywzMi42LDM2LjEsNTYsMjguNWgwQzQzOC40LDQzNi43LDQ1MS4yLDQxMS42LDQ0My42LDM4OC4zeiIvPjxwYXRoIGNsYXNzPSJzdDE4IiBkPSJNMjY3LDQ0NS43TDE1My43LDk3LjFjLTcuNi0yMy4zLTMyLjYtMzYuMS01Ni0yOC41bC0wLjUsMC4yYy0yMy4zLDcuNi0zNi4xLDMyLjYtMjguNSw1NmwxMTMuMywzNDguNiAgIGM3LjYsMjMuMywzMi42LDM2LjEsNTYsMjguNWwwLjUtMC4yQzI2MS45LDQ5NC4xLDI3NC42LDQ2OSwyNjcsNDQ1Ljd6Ii8+PHJlY3QgY2xhc3M9InN0MTkiIGhlaWdodD0iODkuNCIgdHJhbnNmb3JtPSJtYXRyaXgoLTAuOTUxIDAuMzA5MSAtMC4zMDkxIC0wLjk1MSAzMzEuOTg5NiAzNDAuMjQ1KSIgd2lkdGg9Ijg5LjQiIHg9Ijk0LjQiIHk9IjE1MS43Ii8+PHJlY3QgY2xhc3M9InN0MjAiIGhlaWdodD0iODguOCIgdHJhbnNmb3JtPSJtYXRyaXgoMC45NTEgLTAuMzA5MSAwLjMwOTEgMC45NTEgLTEwNS43NDk4IDc5LjAzMDEpIiB3aWR0aD0iODkuNCIgeD0iMTUxLjgiIHk9IjMyOC44Ii8+PHJlY3QgY2xhc3M9InN0MjEiIGhlaWdodD0iODguOCIgdHJhbnNmb3JtPSJtYXRyaXgoMC45NTEgLTAuMzA5MSAwLjMwOTEgMC45NTEgLTc5LjMyNSAxMzAuODY4OSkiIHdpZHRoPSI4OC44IiB4PSIzMjguOSIgeT0iMjcxLjMiLz48L2c+PC9zdmc+"}},"spec":{"source":{"flow":{"from":{"uri":"slack:general","parameters":{"token":"{{slack.token}}"},"steps":[{"marshal":{"json":{}}},{"to":"log:info"}]}},"integration":{"configuration":[{"type":"secret","value":"slack"}],"dependencies":["camel:jackson"]}},"sink":{"ref":{"apiVersion":"messaging.knative.dev/v1beta1","kind":"InMemoryChannel","name":"slack"}}}},\n  {"apiVersion":"sources.knative.dev/v1alpha1","kind":"CamelSource","metadata":{"name":"aws-kinesis","labels":{"console.openshift.io/event-source":"true"},"annotations":{"console.openshift.io/icon":"data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMzA4LjIzNDAxIj48dGl0bGU+YXdzLWtpbmVzaXM8L3RpdGxlPjxwYXRoIGQ9Ik0wLDE3Mi4wODdsMTI3Ljc1NCw1OC44MSwxMjcuNzUyLTU4LjgxLTEyNy43NTItNS4yOTNaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjZmNiZjkyIi8+PHBhdGggZD0iTTEyOC4xNDcsMCwuMDU5LDYzLjg4MXY5MC4xMzZIMTUzLjY0OFYxMi43NTFaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjOWQ1MDI1Ii8+PHBhdGggZD0iTS4wNTksMjE3LjU1OWwxMjguMTYyLDkwLjY3NUwyNTYsMjE3LjU1OSwxMjcuOTQ1LDE5OC45MjZaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjZmNiZjkyIi8+PHBhdGggZD0iTTEyOC4xNDYsMTU0LjAxN2g2Ny41NzdWNTcuODM2TDE3NS45OSw0OS45NDMsMTI4LjE0Niw2My44OThaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjOWQ1MDI1Ii8+PHBhdGggZD0iTTE3NS45OSwxNTQuMDE3aDUyLjIzM1Y5MS42MzJsLTE0Ljk0LTQuNDgxLTM3LjI5Myw2LjMzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMDA1KSIgZmlsbD0iIzlkNTAyNSIvPjxwYXRoIGQ9Ik0yMTMuMjgyLDgyLjI2djcxLjc1N2g0Mi4yMjRMMjU2LDgxLjk0MWwtMTIuODI2LTUuMTI0WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMDA1KSIgZmlsbD0iIzlkNTAyNSIvPjxwYXRoIGQ9Ik0xMjguMTQ3LDBWMTU0LjAxN2gyNS41VjEyLjc1MVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMTk1LjcyNCw1Ny44MzZsLTE5LjczMy03Ljg5NFYxNTQuMDE3aDE5LjczMloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMjI4LjIyNCw5MS42MzJsLTE0Ljk0MS00LjQ4djY2Ljg2NWgxNC45NFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMjQzLjE3NCwxNTQuMDE3SDI1NlY4MS45NDFsLTEyLjgyNi01LjEyNFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNMTI3Ljc1NCwxODQuODYzdjQ2LjAzM2wxMjcuNzUyLTMxLjg0NFYxNzIuMDg3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMDA1KSIgZmlsbD0iI2Y2ODUzNCIvPjxwYXRoIGQ9Ik0xMjcuNzU0LDI2Mi43ODF2NDUuNDUzTDI1NiwyNDQuMTE0VjIxNy41NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiNmNjg1MzQiLz48cGF0aCBkPSJNLjA1OSwyNDQuMzlsMTI3LjY5NSw2My44NDRWMjYyLjQ0OEwuMDU4LDIxNy41NThaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDAuMDAwMDUpIiBmaWxsPSIjOWQ1MDI1Ii8+PHBhdGggZD0iTTAsMTk5LjA1MWwxMjcuNzU0LDMxLjg0NVYxODQuODYyTDAsMTcyLjA4NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDAwNSkiIGZpbGw9IiM5ZDUwMjUiLz48L3N2Zz4="}},"spec":{"source":{"flow":{"from":{"uri":"aws-kinesis:stream","parameters":{"secretKey":"{{aws.kinesis.secretKey}}","accessKey":"{{aws.kinesis.accessKey}}","region":"{{aws.kinesis.region}}"},"steps":[{"marshal":{"json":{}}},{"to":"log:info"}]}},"integration":{"configuration":[{"type":"secret","value":"aws-kinesis"}],"dependencies":["camel:jackson","camel:camel-aws-kinesis","mvn:com.fasterxml.jackson.dataformat/jackson-dataformat-cbor/2.10.4"]}},"sink":{"ref":{"apiVersion":"messaging.knative.dev/v1beta1","kind":"InMemoryChannel","name":"aws-kinesis"}}}},\n  {"apiVersion":"sources.knative.dev/v1alpha1","kind":"CamelSource","metadata":{"name":"jira","labels": {"console.openshift.io/event-source": "true"}, "annotations": {"console.openshift.io/icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjU2cHgiIGhlaWdodD0iMjU2cHgiIHZpZXdCb3g9IjAgMCAyNTYgMjU2IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIj4KICAgIDxkZWZzPgogICAgICAgIDxsaW5lYXJHcmFkaWVudCB4MT0iOTguMDMwODY3NSUiIHkxPSIwLjE2MDU5OTU3MiUiIHgyPSI1OC44ODc3MDYyJSIgeTI9IjQwLjc2NTUyNDYlIiBpZD0ibGluZWFyR3JhZGllbnQtMSI+CiAgICAgICAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMwMDUyQ0MiIG9mZnNldD0iMTglIj48L3N0b3A+CiAgICAgICAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMyNjg0RkYiIG9mZnNldD0iMTAwJSI+PC9zdG9wPgogICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgICAgPGxpbmVhckdyYWRpZW50IHgxPSIxMDAuNjY1MjQ3JSIgeTE9IjAuNDU1MDMyMTIlIiB4Mj0iNTUuNDAxODA5NSUiIHkyPSI0NC43MjY5ODA3JSIgaWQ9ImxpbmVhckdyYWRpZW50LTIiPgogICAgICAgICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMDA1MkNDIiBvZmZzZXQ9IjE4JSI+PC9zdG9wPgogICAgICAgICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMjY4NEZGIiBvZmZzZXQ9IjEwMCUiPjwvc3RvcD4KICAgICAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPC9kZWZzPgogICAgPGc+CgkJCQk8cGF0aCBkPSJNMjQ0LjY1Nzc3OCwwIEwxMjEuNzA2NjY3LDAgQzEyMS43MDY2NjcsMTQuNzIwMTA0NiAxMjcuNTU0MjA1LDI4LjgzNzMxMiAxMzcuOTYyODkxLDM5LjI0NTk5NzcgQzE0OC4zNzE1NzcsNDkuNjU0NjgzNSAxNjIuNDg4Nzg0LDU1LjUwMjIyMjIgMTc3LjIwODg4OSw1NS41MDIyMjIyIEwxOTkuODU3Nzc4LDU1LjUwMjIyMjIgTDE5OS44NTc3NzgsNzcuMzY4ODg4OSBDMTk5Ljg3NzM5MSwxMDcuOTk0MTU1IDIyNC42OTkxNzgsMTMyLjgxNTk0MyAyNTUuMzI0NDQ0LDEzMi44MzU1NTYgTDI1NS4zMjQ0NDQsMTAuNjY2NjY2NyBDMjU1LjMyNDQ0NCw0Ljc3NTYyOTM0IDI1MC41NDg4MTUsMy42MDcyMjAwMWUtMTYgMjQ0LjY1Nzc3OCwwIFoiIGZpbGw9IiMyNjg0RkYiPjwvcGF0aD4KCQkJCTxwYXRoIGQ9Ik0xODMuODIyMjIyLDYxLjI2MjIyMjIgTDYwLjg3MTExMTEsNjEuMjYyMjIyMiBDNjAuODkwNzIzOCw5MS44ODc0ODg4IDg1LjcxMjUxMTIsMTE2LjcwOTI3NiAxMTYuMzM3Nzc4LDExNi43Mjg4ODkgTDEzOC45ODY2NjcsMTE2LjcyODg4OSBMMTM4Ljk4NjY2NywxMzguNjY2NjY3IEMxMzkuMDI1OTA1LDE2OS4yOTE5MjMgMTYzLjg2MzYwNywxOTQuMDk3ODAzIDE5NC40ODg4ODksMTk0LjA5Nzc3OCBMMTk0LjQ4ODg4OSw3MS45Mjg4ODg5IEMxOTQuNDg4ODg5LDY2LjAzNzg1MTYgMTg5LjcxMzI2LDYxLjI2MjIyMjIgMTgzLjgyMjIyMiw2MS4yNjIyMjIyIFoiIGZpbGw9InVybCgjbGluZWFyR3JhZGllbnQtMSkiPjwvcGF0aD4KCQkJCTxwYXRoIGQ9Ik0xMjIuOTUxMTExLDEyMi40ODg4ODkgTDAsMTIyLjQ4ODg4OSBDMy43NTM5MTM2MmUtMTUsMTUzLjE0MTkyIDI0Ljg0OTE5MTMsMTc3Ljk5MTExMSA1NS41MDIyMjIyLDE3Ny45OTExMTEgTDc4LjIyMjIyMjIsMTc3Ljk5MTExMSBMNzguMjIyMjIyMiwxOTkuODU3Nzc4IEM3OC4yNDE3NjcsMjMwLjQ1NTMyIDEwMy4wMjAyODUsMjU1LjI2NTY0NyAxMzMuNjE3Nzc4LDI1NS4zMjQ0NDQgTDEzMy42MTc3NzgsMTMzLjE1NTU1NiBDMTMzLjYxNzc3OCwxMjcuMjY0NTE4IDEyOC44NDIxNDgsMTIyLjQ4ODg4OSAxMjIuOTUxMTExLDEyMi40ODg4ODkgWiIgZmlsbD0idXJsKCNsaW5lYXJHcmFkaWVudC0yKSI+PC9wYXRoPgoJCTwvZz4KPC9zdmc+Cg=="}},"spec":{"source":{"integration":{"configuration":[{"type":"secret","value":"jira"}],"dependencies":["camel:jackson","mvn:org.apache.httpcomponents:httpclient:jar:4.5.12","mvn:com.atlassian.jira:jira-rest-java-client-core:jar:5.2.1","mvn:com.atlassian.jira:jira-rest-java-client-api:jar:5.2.1"]},"flow":{"from":{"uri":"jira:newIssues","parameters":{"jiraUrl":"{{jira.url}}","username":"{{jira.username}}","password":"{{jira.password}}","jql":"{{jira.jql}}","delay":"500"},"steps":[{"to":"log:received?showAll=true&multiline=true"},{"marshal":{"json":{"disable-features":"FAIL_ON_EMPTY_BEANS"}}}]}}},"sink":{"ref":{"apiVersion":"messaging.knative.dev/v1alpha1","kind":"InMemoryChannel","name":"jira"}}}}\n]',
        capabilities: 'Basic Install',
        'olm.operatorNamespace': 'openshift-operators',
        containerImage:
          'quay.io/openshift-knative/knative-eventing-sources-camel-source-controller:v0.15.0',
        createdAt: '2020-07-16T09:15:43+02:00',
        categories: 'Integration & Delivery',
        description:
          'The Knative Camel addon provides a collection of eventing sources from the popular integration framework Apache Camel.',
        'olm.operatorGroup': 'global-operators',
      },
      selfLink:
        '/apis/operators.coreos.com/v1alpha1/namespaces/my-app/clusterserviceversions/knative-camel-operator.v0.15.0-20200716091543',
      resourceVersion: '108547',
      name: 'knative-camel-operator.v0.15.0-20200716091543',
      uid: '700a45fe-1ebe-4432-a6a7-2c1ae4391a1d',
      creationTimestamp: '2020-07-16T15:18:52Z',
      generation: 1,
      namespace: 'my-app',
      labels: {
        'console.openshift.io/event-source-provider': 'true',
        'olm.api.c766370cb4da0c0c': 'required',
        'olm.api.cf25648aa5bc41fd': 'provided',
        'olm.copiedFrom': 'openshift-operators',
      },
    },
    spec: {
      install: {
        strategy: 'Deployment',
        spec: {
          permissions: [
            {
              serviceAccountName: '',
              rules: [{ apiGroups: [], resources: [], verbs: [] }],
            },
          ],
          deployments: [{ name: '', spec: {} }],
        },
      },
      installModes: [{ type: InstallModeType.InstallModeTypeAllNamespaces, supported: true }],
      customresourcedefinitions: {
        owned: [
          {
            description: 'Represents a Knative Source based on Apache Camel',
            displayName: 'Camel Source',
            kind: 'CamelSource',
            name: 'camelsources.sources.knative.dev',
            version: 'v1alpha1',
          },
        ],
        required: [
          {
            description: 'Represents a Camel K Integration',
            displayName: 'Camel K Integration',
            kind: 'Integration',
            name: 'integrations.camel.apache.org',
            version: 'v1',
          },
        ],
      },
      apiservicedefinitions: {},
      keywords: ['serverless', 'eventing', 'apache camel', 'camel k'],
      displayName: 'Knative Apache Camel Operator',
      provider: { name: 'Red Hat' },
      maturity: 'alpha',
      version: '0.15.0-20200716091543',
      minKubeVersion: '1.11.0',
      links: [
        { name: 'Knative Eventing Contrib', url: 'https://github.com/knative/eventing-contrib' },
        { name: 'Documentation', url: 'https://www.knative.dev/docs/' },
      ],
      maintainers: [{ email: 'knative@redhat.com', name: 'Knative Team' }],
      description:
        'The Knative Camel addon provides a collection of eventing sources from the popular integration framework [Apache Camel](http://camel.apache.org/).\nSources are based on [Camel K integrations](https://github.com/apache/camel-k), a subproject of Apache Camel for running integration code in the cloud.\n\nFor documentation on using Knative Camel Sources, see the\n[Camel Source section](https://knative.dev/docs/eventing/samples/apache-camel-source/) of the\n[Knative documentation site](https://www.knative.dev/docs).\n\nThe operator requires Camel K 1.0.0 to be installed in any namespace where you want to run Camel eventing sources. Please, refer to the\n[Camel K documentation](https://github.com/apache/camel-k) for installation instructions.\n\nKnative Serving and Eventing are also required for installing this operator.\n',
      selector: { matchLabels: { name: 'knative-camel' } },
      labels: { name: 'knative-camel' },
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
