import {
  K8sResourceKind,
  K8sKind,
  CustomResourceDefinitionKind,
} from '@console/internal/module/k8s';
import {
  OperatorGroupKind,
  PackageManifestKind,
  SubscriptionKind,
  InstallPlanKind,
  CatalogSourceKind,
  ClusterServiceVersionKind,
  ClusterServiceVersionPhase,
  CSVConditionReason,
  InstallPlanApproval,
  InstallPlanPhase,
} from './src/types';
import { StatusCapability, SpecCapability } from './src/components/descriptors/types';
import { OperatorHubItem, ProviderType } from './src/components/operator-hub';

const prefixedCapabilities = new Set([
  SpecCapability.selector,
  SpecCapability.k8sResourcePrefix,
  SpecCapability.fieldGroup,
  SpecCapability.arrayFieldGroup,
  StatusCapability.k8sResourcePrefix,
]);

export const testClusterServiceVersion: ClusterServiceVersionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'ClusterServiceVersion',
  metadata: {
    annotations: {
      'olm.operatorNamespace': 'openshift-operators',
      'olm.targetNamespaces': 'openshift-operators',
    },
    name: 'testapp',
    uid: 'c02c0a8f-88e0-11e7-851b-080027b424ef',
    creationTimestamp: '2017-09-20T18:19:49Z',
    deletionTimestamp: null,
    namespace: 'default',
  },
  spec: {
    displayName: 'Test App',
    version: '1.0.0',
    description: 'This app does cool stuff',
    provider: {
      name: 'MyCompany, Inc',
    },
    links: [{ name: 'Documentation', url: 'https://docs.testapp.com' }],
    maintainers: [{ name: 'John Doe', email: 'johndoe@example.com' }],
    icon: [{ base64data: '', mediatype: 'image/png' }],
    labels: {
      'alm-owner-testapp': 'testapp.clusterserviceversions.operators.coreos.com.v1alpha1',
      'alm-catalog': 'open-cloud-services.coreos.com',
    },
    selector: {
      matchLabels: {
        'alm-owner-testapp': 'testapp.clusterserviceversions.operators.coreos.com.v1alpha1',
      },
    },
    installModes: [],
    install: {
      strategy: 'Deployment',
      spec: {
        permissions: [
          {
            serviceAccountName: 'testapp-operator',
            rules: [
              { apiGroups: ['testapp.coreos.com'], resources: ['testresources'], verbs: ['*'] },
            ],
          },
        ],
        deployments: [{ name: 'testapp-operator', spec: {} }],
      },
    },
    customresourcedefinitions: {
      owned: [
        {
          name: 'testresources.testapp.coreos.com',
          kind: 'TestResource',
          version: 'v1alpha1',
          displayName: 'Test Resource',
          resources: [
            {
              kind: 'Pod',
              version: 'v1',
            },
          ],
          specDescriptors: Object.keys(SpecCapability)
            .filter((c) => !prefixedCapabilities.has(SpecCapability[c]))
            .map((capability) => ({
              description: `Spec descriptor for ${capability}`,
              displayName: capability
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase()),
              path: capability,
              'x-descriptors': [SpecCapability[capability]],
            })),
          statusDescriptors: [
            {
              path: 'podStatusus',
              displayName: 'Member Status',
              description: 'Status of each member pod ',
              'x-descriptors': [StatusCapability.podStatuses],
              value: { ready: ['pod-0', 'pod-1'], unhealthy: ['pod-2'], stopped: ['pod-3'] },
            },
            {
              path: 'some-unfilled-path',
              displayName: 'Some Unfilled Path',
              description: 'This status is unfilled in the tests',
              'x-descriptors': [StatusCapability.text],
            },
            {
              path: 'some-filled-path',
              displayName: 'Some Status',
              description: 'This status is filled',
              'x-descriptors': [StatusCapability.text],
            },
          ],
        },
      ],
    },
  },
  status: {
    phase: ClusterServiceVersionPhase.CSVPhaseSucceeded,
    reason: CSVConditionReason.CSVReasonInstallSuccessful,
    lastUpdateTime: '2020-04-21T18:19:49Z',
  },
};

export const localClusterServiceVersion: ClusterServiceVersionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'ClusterServiceVersion',
  metadata: {
    name: 'local-testapp',
    uid: 'c02c0a8f-88e0-12e7-851b-080027b424ef',
    creationTimestamp: '2017-08-20T18:19:49Z',
    namespace: 'default',
  },
  spec: {
    displayName: 'Local Test App',
    description: 'This app does cool stuff - locally',
    labels: {
      'alm-owner-local-testapp':
        'local-testapp.clusterserviceversions.operators.coreos.com.v1alpha1',
    },
    selector: {
      matchLabels: {
        'alm-owner-local-testapp':
          'local-testapp.clusterserviceversions.operators.coreos.com.v1alpha1',
      },
    },
    installModes: [],
    install: {
      strategy: 'Deployment',
      spec: {
        permissions: [
          {
            serviceAccountName: 'local-operator',
            rules: [
              { apiGroups: ['testapp.coreos.com'], resources: ['testresources'], verbs: ['*'] },
            ],
          },
        ],
        deployments: [{ name: 'testapp-operator', spec: {} }],
      },
    },
    customresourcedefinitions: {
      owned: [
        {
          name: 'testresources.testapp.coreos.com',
          kind: 'TestResource',
          version: 'v1',
          displayName: 'Test Resource',
          statusDescriptors: [],
        },
      ],
    },
  },
  status: {
    phase: ClusterServiceVersionPhase.CSVPhaseSucceeded,
    reason: CSVConditionReason.CSVReasonInstallSuccessful,
  },
};

export const testResourceInstance: K8sResourceKind = {
  apiVersion: 'testapp.coreos.com/v1alpha1',
  kind: 'TestResource',
  metadata: {
    name: 'my-test-resource',
    namespace: 'default',
    uid: 'c02c0a8f-88e0-12e7-851b-081027b424ef',
    creationTimestamp: '2017-06-20T18:19:49Z',
  },
  spec: {
    selector: {
      matchLabels: {
        fizz: 'buzz',
      },
    },
  },
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testOwnedResourceInstance: K8sResourceKind = {
  apiVersion: 'ownedoperators.coreos.com/v1alpha1',
  kind: 'TestOwnedResource',
  metadata: {
    name: 'owned-test-resource',
    uid: '62fa5eac-3df4-448d-a576-916dd5b432f2',
    creationTimestamp: '2005-02-20T18:13:42Z',
    ownerReferences: [
      {
        name: testResourceInstance.metadata.name,
        kind: 'TestResource',
        apiVersion: testResourceInstance.apiVersion,
        uid: testResourceInstance.metadata.uid,
      },
    ],
  },
  spec: {},
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testOperatorGroup: OperatorGroupKind = {
  apiVersion: 'operators.coreos.com/v1',
  kind: 'OperatorGroup',
  metadata: {
    name: 'test-operatorgroup',
    namespace: 'default',
  },
  spec: {
    selector: {},
  },
};

export const testPackageManifest: PackageManifestKind = {
  apiVersion: 'packages.operators.coreos.com/v1',
  kind: 'PackageManifest',
  metadata: {
    name: 'test-package',
    namespace: 'default',
  },
  spec: {},
  status: {
    catalogSource: 'test-catalog',
    catalogSourceNamespace: 'tectonic-system',
    catalogSourceDisplayName: 'Test Catalog',
    catalogSourcePublisher: 'Test Publisher',
    provider: {
      name: 'CoreOS, Inc',
    },
    packageName: 'test-package',
    channels: [
      {
        name: 'alpha',
        currentCSV: 'testapp',
        currentCSVDesc: {
          displayName: 'Test App',
          icon: [{ mediatype: 'image/png', base64data: '' }],
          version: '0.0.1',
          provider: {
            name: 'CoreOS, Inc',
          },
          installModes: [],
        },
      },
    ],
    defaultChannel: 'alpha',
  },
};

export const testCatalogSource: CatalogSourceKind = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'CatalogSource',
  metadata: {
    name: 'test-catalog',
    namespace: 'tectonic-system',
    creationTimestamp: '2018-05-02T18:10:38Z',
  },
  spec: {
    name: 'test-catalog',
    sourceType: 'internal',
    publisher: 'CoreOS, Inc',
    displayName: 'Test Catalog',
  },
};

export const testInstallPlan: InstallPlanKind = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'InstallPlan',
  metadata: {
    namespace: 'default',
    name: 'etcd',
    uid: '042d62a9-63dd-4ece-b74a-95944ce78268',
    ownerReferences: [
      {
        name: 'etcd-subscription',
        kind: 'Subscription',
        uid: 'c0220a8f-88e0-12e7-83ed-081027b424ea',
        apiVersion: 'operators.coreos.com/v1alpha1',
      },
    ],
  },
  spec: {
    clusterServiceVersionNames: ['etcd'],
    approval: InstallPlanApproval.Automatic,
  },
  status: {
    phase: InstallPlanPhase.InstallPlanPhaseComplete,
    catalogSources: ['test-catalog'],
    plan: [],
  },
};

export const testOperatorDeployment: K8sResourceKind = {
  apiVersion: 'apps/v1beta2',
  kind: 'Deployment',
  metadata: {
    namespace: testClusterServiceVersion.metadata.namespace,
    name: 'test-operator',
    ownerReferences: [
      {
        name: testClusterServiceVersion.metadata.name,
        uid: testClusterServiceVersion.metadata.uid,
        kind: testClusterServiceVersion.kind,
        apiVersion: testClusterServiceVersion.apiVersion,
      },
    ],
  },
  spec: {},
};

export const testSubscription: SubscriptionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  metadata: {
    namespace: 'default',
    name: 'test-subscription',
    uid: '09232c51-ed3e-4e60-b58e-9bee576ee612',
  },
  spec: {
    source: 'test-catalog',
    sourceNamespace: 'tectonic-system',
    name: 'test-package',
    channel: 'stable',
  },
};

export const testCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
    labels: {
      'owner-testapp': 'testapp.clusterserviceversions.coreos.com',
    },
    annotations: {
      displayName: 'Dashboard',
      description: 'Test Dashboard',
    },
  },
  spec: {
    group: 'testapp.coreos.com',
    versions: [
      {
        name: 'v1alpha1',
        served: true,
        storage: true,
        schema: {
          openAPIV3Schema: {},
        },
      },
    ],
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
    scope: 'Cluster',
  },
};

export const testModel: K8sKind = {
  abbr: 'TR',
  apiGroup: 'testapp.coreos.com',
  apiVersion: 'v1alpha1',
  crd: true,
  kind: 'TestResource',
  label: 'Test Resource',
  labelPlural: 'Test Resources',
  namespaced: true,
  plural: 'testresources',
};

const amqPackageManifest = {
  apiVersion: 'packages.operators.coreos.com/v1' as PackageManifestKind['apiVersion'],
  kind: 'PackageManifest' as PackageManifestKind['kind'],
  metadata: {
    name: 'amq-streams',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink:
      '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/amq-streams',
    creationTimestamp: '2018-10-23T12:50:22Z',
    labels: {
      catalog: 'rh-operators',
      'catalog-namespace': 'openshift-operator-lifecycle-manager',
      provider: 'Red Hat',
      'provider-url': '',
    },
  },
  spec: {},
  status: {
    catalogSource: 'rh-operators',
    catalogSourceDisplayName: 'Red Hat Operators',
    catalogSourcePublisher: 'Red Hat',
    catalogSourceNamespace: 'openshift-operator-lifecycle-manager',
    provider: {
      name: 'Red Hat',
    },
    packageName: 'amq-streams',
    channels: [
      {
        name: 'preview',
        currentCSV: 'amqstreams.v1.0.0.beta',
        currentCSVDesc: {
          displayName: 'AMQ Streams',
          icon: [],
          version: '1.0.0-Beta',
          provider: {
            name: 'Red Hat',
          },
          installModes: [],
          annotations: {
            'alm-examples':
              '[{"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"Kafka","metadata":{"name":"my-cluster"},"spec":{"kafka":{"replicas":3,"listeners":{"plain":{},"tls":{}},"config":{"offsets.topic.replication.factor":3,"transaction.state.log.replication.factor":3,"transaction.state.log.min.isr":2},"storage":{"type":"ephemeral"}},"zookeeper":{"replicas":3,"storage":{"type":"ephemeral"}},"entityOperator":{"topicOperator":{},"userOperator":{}}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaConnect","metadata":{"name":"my-connect-cluster"},"spec":{"replicas":1,"bootstrapServers":"my-cluster-kafka-bootstrap:9093","tls":{"trustedCertificates":[{"secretName":"my-cluster-cluster-ca-cert","certificate":"ca.crt"}]}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaConnectS2I","metadata":{"name":"my-connect-cluster"},"spec":{"replicas":1,"bootstrapServers":"my-cluster-kafka-bootstrap:9093","tls":{"trustedCertificates":[{"secretName":"my-cluster-cluster-ca-cert","certificate":"ca.crt"}]}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaTopic","metadata":{"name":"my-topic","labels":{"strimzi.io/cluster":"my-cluster"}},"spec":{"partitions":10,"replicas":3,"config":{"retention.ms":604800000,"segment.bytes":1073741824}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaUser","metadata":{"name":"my-user","labels":{"strimzi.io/cluster":"my-cluster"}},"spec":{"authentication":{"type":"tls"},"authorization":{"type":"simple","acls":[{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Read","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Describe","host":"*"},{"resource":{"type":"group","name":"my-group","patternType":"literal"},"operation":"Read","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Write","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Create","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Describe","host":"*"}]}}}]',
            description:
              '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
            categories: 'messaging,streaming',
          },
        },
      },
    ],
    defaultChannel: '',
  },
};

const etcdPackageManifest = {
  apiVersion: 'packages.operators.coreos.com/v1' as PackageManifestKind['apiVersion'],
  kind: 'PackageManifest' as PackageManifestKind['kind'],
  metadata: {
    name: 'etcd',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink:
      '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/etcd',
    creationTimestamp: '2018-10-23T12:50:22Z',
    labels: {
      catalog: 'rh-operators',
      'catalog-namespace': 'openshift-operator-lifecycle-manager',
      provider: 'CoreOS, Inc',
      'provider-url': '',
      'opsrc-provider': 'community',
    },
  },
  spec: {},
  status: {
    catalogSource: 'rh-operators',
    catalogSourceDisplayName: 'Red Hat Operators',
    catalogSourcePublisher: 'Red Hat',
    catalogSourceNamespace: 'openshift-operator-lifecycle-manager',
    provider: {
      name: 'CoreOS, Inc',
    },
    packageName: 'etcd',
    channels: [
      {
        name: 'alpha',
        currentCSV: 'etcdoperator.v0.9.2',
        currentCSVDesc: {
          displayName: 'etcd',
          icon: [],
          version: '0.9.2',
          provider: {
            name: 'CoreOS, Inc',
          },
          installModes: [],
          annotations: {
            'alm-examples':
              '[{"apiVersion":"etcd.database.coreos.com/v1beta2","kind":"EtcdCluster","metadata":{"name":"example","namespace":"default"},"spec":{"size":3,"version":"3.2.13"}},{"apiVersion":"etcd.database.coreos.com/v1beta2","kind":"EtcdRestore","metadata":{"name":"example-etcd-cluster"},"spec":{"etcdCluster":{"name":"example-etcd-cluster"},"backupStorageType":"S3","s3":{"path":"<full-s3-path>","awsSecret":"<aws-secret>"}}},{"apiVersion":"etcd.database.coreos.com/v1beta2","kind":"EtcdBackup","metadata":{"name":"example-etcd-cluster-backup"},"spec":{"etcdEndpoints":["<etcd-cluster-endpoints>"],"storageType":"S3","s3":{"path":"<full-s3-path>","awsSecret":"<aws-secret>"}}}]',
            'tectonic-visibility': 'ocs',
            description:
              'etcd is a distributed key value store that provides a reliable way to store data across a cluster of machines.',
            categories: 'database',
          },
        },
      },
    ],
    defaultChannel: '',
  },
};

const federationv2PackageManifest = {
  apiVersion: 'packages.operators.coreos.com/v1' as PackageManifestKind['apiVersion'],
  kind: 'PackageManifest' as PackageManifestKind['kind'],
  metadata: {
    name: 'federationv2',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink:
      '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/federationv2',
    creationTimestamp: '2018-10-23T12:50:22Z',
    labels: {
      catalog: 'rh-operators',
      'catalog-namespace': 'openshift-operator-lifecycle-manager',
      provider: 'Red Hat',
      'provider-url': '',
    },
  },
  spec: {},
  status: {
    catalogSource: 'rh-operators',
    catalogSourceDisplayName: 'Red Hat Operators',
    catalogSourcePublisher: 'Red Hat',
    catalogSourceNamespace: 'openshift-operator-lifecycle-manager',
    provider: {
      name: 'Red Hat',
    },
    packageName: 'federationv2',
    channels: [
      {
        name: 'alpha',
        currentCSV: 'federationv2.v0.0.2',
        currentCSVDesc: {
          icon: [],
          displayName: 'FederationV2',
          version: '0.0.2',
          provider: {
            name: 'Red Hat',
          },
          installModes: [],
          annotations: {
            description: 'Kubernetes Federation V2 namespace-scoped installation',
            categories: '',
          },
        },
      },
    ],
    defaultChannel: '',
  },
};

const prometheusPackageManifest = {
  apiVersion: 'packages.operators.coreos.com/v1' as PackageManifestKind['apiVersion'],
  kind: 'PackageManifest' as PackageManifestKind['kind'],
  metadata: {
    name: 'prometheus',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink:
      '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/prometheus',
    creationTimestamp: '2018-10-23T12:50:22Z',
    labels: {
      catalog: 'rh-operators',
      'catalog-namespace': 'openshift-operator-lifecycle-manager',
      provider: 'Red Hat',
      'provider-url': '',
    },
  },
  spec: {},
  status: {
    catalogSource: 'rh-operators',
    catalogSourceDisplayName: 'Red Hat Operators',
    catalogSourcePublisher: 'Red Hat',
    catalogSourceNamespace: 'openshift-operator-lifecycle-manager',
    provider: {
      name: 'Red Hat',
    },
    packageName: 'prometheus',
    channels: [
      {
        name: 'preview',
        currentCSV: 'prometheusoperator.0.22.2',
        currentCSVDesc: {
          displayName: 'Prometheus Operator',
          icon: [],
          version: '0.22.2',
          provider: {
            name: 'Red Hat',
          },
          installModes: [],
          annotations: {
            'alm-examples':
              '[{"apiVersion":"monitoring.coreos.com/v1","kind":"Prometheus","metadata":{"name":"example","labels":{"prometheus":"k8s"}},"spec":{"replicas":2,"version":"v2.3.2","serviceAccountName":"prometheus-k8s","securityContext": {}, "serviceMonitorSelector":{"matchExpressions":[{"key":"k8s-app","operator":"Exists"}]},"ruleSelector":{"matchLabels":{"role":"prometheus-rulefiles","prometheus":"k8s"}},"alerting":{"alertmanagers":[{"namespace":"monitoring","name":"alertmanager-main","port":"web"}]}}},{"apiVersion":"monitoring.coreos.com/v1","kind":"ServiceMonitor","metadata":{"name":"example","labels":{"k8s-app":"prometheus"}},"spec":{"selector":{"matchLabels":{"k8s-app":"prometheus"}},"endpoints":[{"port":"web","interval":"30s"}]}},{"apiVersion":"monitoring.coreos.com/v1","kind":"Alertmanager","metadata":{"name":"alertmanager-main"},"spec":{"replicas":3, "securityContext": {}}}]',
            description:
              'The Prometheus Operator for Kubernetes provides easy monitoring definitions for Kubernetes services and deployment and management of Prometheus instances.',
            categories: 'monitoring,alerting',
          },
        },
      },
    ],
    defaultChannel: '',
  },
};

const svcatPackageManifest = {
  apiVersion: 'packages.operators.coreos.com/v1' as PackageManifestKind['apiVersion'],
  kind: 'PackageManifest' as PackageManifestKind['kind'],
  metadata: {
    name: 'svcat',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink:
      '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/svcat',
    creationTimestamp: '2018-10-23T12:50:22Z',
    labels: {
      catalog: 'rh-operators',
      'catalog-namespace': 'openshift-operator-lifecycle-manager',
      provider: 'Red Hat',
      'provider-url': '',
    },
  },
  spec: {},
  status: {
    catalogSource: 'rh-operators',
    catalogSourceDisplayName: 'Red Hat Operators',
    catalogSourcePublisher: 'Red Hat',
    catalogSourceNamespace: 'openshift-operator-lifecycle-manager',
    provider: {
      name: 'Red Hat',
    },
    packageName: 'svcat',
    channels: [
      {
        name: 'alpha',
        currentCSV: 'svcat.v0.1.34',
        currentCSVDesc: {
          icon: [],
          displayName: 'Service Catalog',
          version: '0.1.34',
          provider: {
            name: 'Red Hat',
          },
          installModes: [],
          annotations: {
            description:
              'Service Catalog lets you provision cloud services directly from the comfort of native Kubernetes tooling.',
            categories: 'catalog',
          },
        },
      },
    ],
    defaultChannel: '',
  },
};

const dummyPackageManifest = {
  apiVersion: 'packages.operators.coreos.com/v1' as PackageManifestKind['apiVersion'],
  kind: 'PackageManifest' as PackageManifestKind['kind'],
  metadata: {
    name: 'dummy',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink:
      '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/dummy',
    creationTimestamp: '2018-10-23T12:50:22Z',
    labels: {
      catalog: 'dummy-operators',
      'catalog-namespace': 'openshift-operator-lifecycle-manager',
      provider: 'Dummy',
      'provider-url': '',
    },
  },
  spec: {},
  status: {
    catalogSource: 'dummy-operators',
    catalogSourceDisplayName: 'Dummy Operators',
    catalogSourcePublisher: 'Dummy',
    catalogSourceNamespace: 'openshift-operator-lifecycle-manager',
    provider: {
      name: 'Dummy',
    },
    packageName: 'dummy',
    channels: [
      {
        name: 'alpha',
        currentCSV: 'dummy.v1.0.0',
        currentCSVDesc: {
          icon: [],
          displayName: 'Dummy Operator',
          version: '1.0.0',
          provider: {
            name: 'Dummy',
          },
          installModes: [],
          annotations: {
            description: 'Dummy is not a real operator',
            categories: 'dummy',
          },
        },
      },
    ],
    defaultChannel: '',
  },
};

export const operatorHubListPageProps = {
  loaded: true,
  loadError: null,
  operatorGroup: { loaded: false },
  catalogSourceConfig: { loaded: false },
  packageManifest: {
    loaded: true,
    data: [
      amqPackageManifest,
      etcdPackageManifest,
      federationv2PackageManifest,
      prometheusPackageManifest,
      svcatPackageManifest,
    ] as PackageManifestKind[],
  },
};

export const operatorHubTileViewPageProps = {
  items: [
    {
      obj: amqPackageManifest,
      installState: 'Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'amq-streams',
      uid: 'amq-streams/openshift-operator-lifecycle-manager',
      imgUrl:
        '/api/kubernetes/apis/packages.operators.coreos.com/v1/packagemanifests/amq-streams/icon?resourceVersion=amq-streams.preview.amqstreams.v1.0.0.beta',
      iconClass: null,
      description:
        '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
      provider: 'Red Hat',
      tags: undefined,
      version: '1.0.0-Beta',
      certifiedLevel: undefined,
      healthIndex: undefined,
      repository: undefined,
      containerImage: undefined,
      createdAt: undefined,
      support: undefined,
      longDescription: undefined,
      categories: ['messaging', 'streaming'],
      catalogSource: 'testing',
      catalogSourceNamespace: 'openshift-marketplace',
      validSubscription: undefined,
      infraFeatures: undefined,
    },
    {
      obj: etcdPackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'etcd',
      uid: 'etcd/openshift-operator-lifecycle-manager',
      imgUrl:
        '/api/kubernetes/apis/packages.operators.coreos.com/v1/packagemanifests/etcd/icon?resourceVersion=etcd.alpha.etcd.v0.9.2',
      iconClass: null,
      description: undefined,
      provider: 'CoreOS, Inc',
      tags: undefined,
      version: '0.9.2',
      certifiedLevel: undefined,
      healthIndex: undefined,
      repository: undefined,
      containerImage: undefined,
      createdAt: undefined,
      support: undefined,
      longDescription: undefined,
      categories: ['database'],
      catalogSource: 'testing',
      catalogSourceNamespace: 'openshift-marketplace',
      validSubscription: undefined,
      infraFeatures: undefined,
    },
    {
      obj: federationv2PackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'federationv2',
      uid: 'federationv2/openshift-operator-lifecycle-manager',
      imgUrl:
        '/api/kubernetes/apis/packages.operators.coreos.com/v1/packagemanifests/federationv2/icon?resourceVersion=federationv2.alpha.federationv2.v0.0.2',
      iconClass: null,
      description: undefined,
      provider: 'Red Hat',
      tags: undefined,
      version: '0.0.2',
      certifiedLevel: undefined,
      healthIndex: undefined,
      repository: undefined,
      containerImage: undefined,
      createdAt: undefined,
      support: undefined,
      longDescription: undefined,
      categories: [],
      catalogSource: 'testing',
      catalogSourceNamespace: 'openshift-marketplace',
      validSubscription: undefined,
      infraFeatures: undefined,
    },
    {
      obj: prometheusPackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'prometheus',
      uid: 'prometheus/openshift-operator-lifecycle-manager',
      imgUrl:
        '/api/kubernetes/apis/packages.operators.coreos.com/v1/packagemanifests/prometheus/icon?resourceVersion=prometheus.preview.prometheusoperator.0.22.2',
      iconClass: null,
      provider: 'Red Hat',
      tags: undefined,
      version: '0.22.2',
      certifiedLevel: undefined,
      healthIndex: undefined,
      repository: undefined,
      containerImage: undefined,
      createdAt: undefined,
      support: undefined,
      longDescription: undefined,
      categories: ['monitoring', 'alerting'],
      catalogSource: 'testing',
      catalogSourceNamespace: 'openshift-marketplace',
      validSubscription: undefined,
      infraFeatures: undefined,
    },
    {
      obj: svcatPackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'svcat',
      uid: 'svcat/openshift-operator-lifecycle-manager',
      imgUrl:
        '/api/kubernetes/apis/packages.operators.coreos.com/v1/packagemanifests/svcat/icon?resourceVersion=svcat.alpha.svcat.v0.1.34',
      iconClass: null,
      description: undefined,
      provider: 'Red Hat',
      tags: undefined,
      version: '0.1.34',
      certifiedLevel: undefined,
      healthIndex: undefined,
      repository: undefined,
      containerImage: undefined,
      createdAt: undefined,
      support: undefined,
      longDescription: undefined,
      categories: ['catalog'],
      catalogSource: 'testing',
      catalogSourceNamespace: 'openshift-marketplace',
      validSubscription: undefined,
      infraFeatures: undefined,
    },
  ] as OperatorHubItem[],
  openOverlay: null,
};

export const operatorHubTileViewPagePropsWithDummy = {
  items: [
    operatorHubTileViewPageProps.items[0],
    operatorHubTileViewPageProps.items[1],
    operatorHubTileViewPageProps.items[2],
    operatorHubTileViewPageProps.items[3],
    operatorHubTileViewPageProps.items[4],
    {
      obj: dummyPackageManifest,
      installed: false,
      kind: 'PackageManifest',
      name: 'dummy',
      uid: 'dummy/openshift-operator-lifecycle-manager',
      iconClass: null,
      description: undefined,
      provider: ProviderType.Custom,
      tags: undefined,
      version: '1.0.0',
      certifiedLevel: undefined,
      healthIndex: undefined,
      repository: undefined,
      containerImage: undefined,
      createdAt: undefined,
      support: undefined,
      longDescription: undefined,
      categories: ['dummy'],
      catalogSource: 'testing',
      catalogSourceNamespace: 'openshift-marketplace',
      validSubscription: undefined,
      infraFeatures: undefined,
    },
  ],
  openOverlay: null,
};

export const filterCounts = {
  CoreOS: 1,
  'Red Hat': 4,
  Installed: 1,
  'Not Installed': 4,
};

export const operatorHubCategories = [
  {
    id: 'all',
    numItems: 8,
  },
  {
    id: 'messaging',
    numItems: 1,
  },
  {
    id: 'streaming',
    numItems: 1,
  },
  {
    id: 'database',
    numItems: 1,
  },
  {
    id: 'monitoring',
    numItems: 1,
  },
  {
    id: 'alerting',
    numItems: 1,
  },
  {
    id: 'catalog',
    numItems: 1,
  },
  {
    id: 'other',
    numItems: 1,
  },
];

export const mockFilterStrings = [
  {
    filter: '',
    resultLength: 5,
  },
  {
    filter: 'prometheus',
    resultLength: 1,
  },
  {
    filter: 'high performance',
    resultLength: 1,
  },
  {
    filter: 'this will have no results',
    resultLength: 0,
  },
];

export const mockProviderStrings = [
  {
    provider: '',
    output: '',
  },
  {
    provider: 'Red Hat',
    output: 'Red Hat',
  },
  {
    provider: 'Red Hat, Inc.',
    output: 'Red Hat',
  },
  {
    provider: 'Dummy LLC',
    output: 'Dummy',
  },
];

export const operatorHubDetailsProps = {
  item: operatorHubTileViewPageProps.items[0],
  closeOverlay: null,
};

export const itemWithLongDescription = {
  obj: amqPackageManifest,
  kind: 'PackageManifest',
  installed: false,
  name: 'amq-streams',
  uid: 'amq-streams/openshift-operator-lifecycle-manager',
  iconClass: null,
  imgUrl:
    '/api/kubernetes/apis/packages.operators.coreos.com/v1/packagemanifests/amq-streams/icon?resourceVersion=amq-streams.preview.amqstreams.v1.0.0.beta',
  description:
    '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
  provider: ProviderType.RedHat,
  tags: undefined,
  version: '1.0.0-Beta',
  certifiedLevel: undefined,
  healthIndex: undefined,
  repository: undefined,
  containerImage: undefined,
  createdAt: undefined,
  support: undefined,
  longDescription:
    '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
  categories: ['messaging', 'streaming'],
  catalogSource: 'testing',
  catalogSourceNamespace: 'openshift-marketplace',
  validSubscription: undefined,
  infraFeatures: undefined,
};
