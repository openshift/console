import { PackageManifestKind } from '../public/components/operator-lifecycle-manager';
import { OperatorHubItem } from '../public/components/operator-hub';

const amqPackageManifest = {
  apiVersion: 'packages.app.redhat.com/v1alpha1',
  kind: 'PackageManifest',
  metadata: {
    name: 'amq-streams',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink: '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/amq-streams',
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
    channels: [{
      name: 'preview',
      currentCSV: 'amqstreams.v1.0.0.beta',
      currentCSVDesc: {
        displayName: 'AMQ Streams',
        icon: [{
          base64data: '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',
          mediatype: 'image/png',
        }],
        version: '1.0.0-Beta',
        provider: {
          name: 'Red Hat',
        },
        installModes: [],
        annotations: {
          'alm-examples': '[{"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"Kafka","metadata":{"name":"my-cluster"},"spec":{"kafka":{"replicas":3,"listeners":{"plain":{},"tls":{}},"config":{"offsets.topic.replication.factor":3,"transaction.state.log.replication.factor":3,"transaction.state.log.min.isr":2},"storage":{"type":"ephemeral"}},"zookeeper":{"replicas":3,"storage":{"type":"ephemeral"}},"entityOperator":{"topicOperator":{},"userOperator":{}}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaConnect","metadata":{"name":"my-connect-cluster"},"spec":{"replicas":1,"bootstrapServers":"my-cluster-kafka-bootstrap:9093","tls":{"trustedCertificates":[{"secretName":"my-cluster-cluster-ca-cert","certificate":"ca.crt"}]}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaConnectS2I","metadata":{"name":"my-connect-cluster"},"spec":{"replicas":1,"bootstrapServers":"my-cluster-kafka-bootstrap:9093","tls":{"trustedCertificates":[{"secretName":"my-cluster-cluster-ca-cert","certificate":"ca.crt"}]}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaTopic","metadata":{"name":"my-topic","labels":{"strimzi.io/cluster":"my-cluster"}},"spec":{"partitions":10,"replicas":3,"config":{"retention.ms":604800000,"segment.bytes":1073741824}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaUser","metadata":{"name":"my-user","labels":{"strimzi.io/cluster":"my-cluster"}},"spec":{"authentication":{"type":"tls"},"authorization":{"type":"simple","acls":[{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Read","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Describe","host":"*"},{"resource":{"type":"group","name":"my-group","patternType":"literal"},"operation":"Read","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Write","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Create","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Describe","host":"*"}]}}}]',
          description: '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
          categories: 'messaging,streaming',
        },
      },
    }],
    defaultChannel: '',
  },
};

const etcdPackageManifest = {
  apiVersion: 'packages.app.redhat.com/v1alpha1',
  kind: 'PackageManifest',
  metadata: {
    name: 'etcd',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink: '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/etcd',
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
    channels: [{
      name: 'alpha',
      currentCSV: 'etcdoperator.v0.9.2',
      currentCSVDesc: {
        displayName: 'etcd',
        icon: [{
          base64data: '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',
          mediatype: 'image/png',
        }],
        version: '0.9.2',
        provider: {
          name: 'CoreOS, Inc',
        },
        installModes: [],
        annotations: {
          'alm-examples': '[{"apiVersion":"etcd.database.coreos.com/v1beta2","kind":"EtcdCluster","metadata":{"name":"example","namespace":"default"},"spec":{"size":3,"version":"3.2.13"}},{"apiVersion":"etcd.database.coreos.com/v1beta2","kind":"EtcdRestore","metadata":{"name":"example-etcd-cluster"},"spec":{"etcdCluster":{"name":"example-etcd-cluster"},"backupStorageType":"S3","s3":{"path":"<full-s3-path>","awsSecret":"<aws-secret>"}}},{"apiVersion":"etcd.database.coreos.com/v1beta2","kind":"EtcdBackup","metadata":{"name":"example-etcd-cluster-backup"},"spec":{"etcdEndpoints":["<etcd-cluster-endpoints>"],"storageType":"S3","s3":{"path":"<full-s3-path>","awsSecret":"<aws-secret>"}}}]',
          'tectonic-visibility': 'ocs',
          description: 'etcd is a distributed key value store that provides a reliable way to store data across a cluster of machines.',
          categories: 'database',
        },
      },
    }],
    defaultChannel: '',
  },
};

const federationv2PackageManifest = {
  apiVersion: 'packages.app.redhat.com/v1alpha1',
  kind: 'PackageManifest',
  metadata: {
    name: 'federationv2',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink: '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/federationv2',
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
    channels: [{
      name: 'alpha',
      currentCSV: 'federationv2.v0.0.2',
      currentCSVDesc: {
        icon: null,
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
    }],
    defaultChannel: '',
  },
};

const prometheusPackageManifest = {
  apiVersion: 'packages.app.redhat.com/v1alpha1',
  kind: 'PackageManifest',
  metadata: {
    name: 'prometheus',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink: '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/prometheus',
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
    channels: [{
      name: 'preview',
      currentCSV: 'prometheusoperator.0.22.2',
      currentCSVDesc: {
        displayName: 'Prometheus Operator',
        icon: [{
          base64data: 'PHN2ZyB3aWR0aD0iMjQ5MCIgaGVpZ2h0PSIyNTAwIiB2aWV3Qm94PSIwIDAgMjU2IDI1NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+PHBhdGggZD0iTTEyOC4wMDEuNjY3QzU3LjMxMS42NjcgMCA1Ny45NzEgMCAxMjguNjY0YzAgNzAuNjkgNTcuMzExIDEyNy45OTggMTI4LjAwMSAxMjcuOTk4UzI1NiAxOTkuMzU0IDI1NiAxMjguNjY0QzI1NiA1Ny45NyAxOTguNjg5LjY2NyAxMjguMDAxLjY2N3ptMCAyMzkuNTZjLTIwLjExMiAwLTM2LjQxOS0xMy40MzUtMzYuNDE5LTMwLjAwNGg3Mi44MzhjMCAxNi41NjYtMTYuMzA2IDMwLjAwNC0zNi40MTkgMzAuMDA0em02MC4xNTMtMzkuOTRINjcuODQyVjE3OC40N2gxMjAuMzE0djIxLjgxNmgtLjAwMnptLS40MzItMzMuMDQ1SDY4LjE4NWMtLjM5OC0uNDU4LS44MDQtLjkxLTEuMTg4LTEuMzc1LTEyLjMxNS0xNC45NTQtMTUuMjE2LTIyLjc2LTE4LjAzMi0zMC43MTYtLjA0OC0uMjYyIDE0LjkzMyAzLjA2IDI1LjU1NiA1LjQ1IDAgMCA1LjQ2NiAxLjI2NSAxMy40NTggMi43MjItNy42NzMtOC45OTQtMTIuMjMtMjAuNDI4LTEyLjIzLTMyLjExNiAwLTI1LjY1OCAxOS42OC00OC4wNzkgMTIuNTgtNjYuMjAxIDYuOTEuNTYyIDE0LjMgMTQuNTgzIDE0LjggMzYuNTA1IDcuMzQ2LTEwLjE1MiAxMC40Mi0yOC42OSAxMC40Mi00MC4wNTYgMC0xMS43NjkgNy43NTUtMjUuNDQgMTUuNTEyLTI1LjkwNy02LjkxNSAxMS4zOTYgMS43OSAyMS4xNjUgOS41MyA0NS40IDIuOTAyIDkuMTAzIDIuNTMyIDI0LjQyMyA0Ljc3MiAzNC4xMzguNzQ0LTIwLjE3OCA0LjIxMy00OS42MiAxNy4wMTQtNTkuNzg0LTUuNjQ3IDEyLjguODM2IDI4LjgxOCA1LjI3IDM2LjUxOCA3LjE1NCAxMi40MjQgMTEuNDkgMjEuODM2IDExLjQ5IDM5LjYzOCAwIDExLjkzNi00LjQwNyAyMy4xNzMtMTEuODQgMzEuOTU4IDguNDUyLTEuNTg2IDE0LjI4OS0zLjAxNiAxNC4yODktMy4wMTZsMjcuNDUtNS4zNTVjLjAwMi0uMDAyLTMuOTg3IDE2LjQwMS0xOS4zMTQgMzIuMTk3eiIgZmlsbD0iI0RBNEUzMSIvPjwvc3ZnPg==',
          mediatype: 'image/svg+xml',
        }],
        version: '0.22.2',
        provider: {
          name: 'Red Hat',
        },
        installModes: [],
        annotations: {
          'alm-examples': '[{"apiVersion":"monitoring.coreos.com/v1","kind":"Prometheus","metadata":{"name":"example","labels":{"prometheus":"k8s"}},"spec":{"replicas":2,"version":"v2.3.2","serviceAccountName":"prometheus-k8s","securityContext": {}, "serviceMonitorSelector":{"matchExpressions":[{"key":"k8s-app","operator":"Exists"}]},"ruleSelector":{"matchLabels":{"role":"prometheus-rulefiles","prometheus":"k8s"}},"alerting":{"alertmanagers":[{"namespace":"monitoring","name":"alertmanager-main","port":"web"}]}}},{"apiVersion":"monitoring.coreos.com/v1","kind":"ServiceMonitor","metadata":{"name":"example","labels":{"k8s-app":"prometheus"}},"spec":{"selector":{"matchLabels":{"k8s-app":"prometheus"}},"endpoints":[{"port":"web","interval":"30s"}]}},{"apiVersion":"monitoring.coreos.com/v1","kind":"Alertmanager","metadata":{"name":"alertmanager-main"},"spec":{"replicas":3, "securityContext": {}}}]',
          description: 'The Prometheus Operator for Kubernetes provides easy monitoring definitions for Kubernetes services and deployment and management of Prometheus instances.',
          categories: 'monitoring,alerting',
        },
      },
    }],
    defaultChannel: '',
  },
};

const svcatPackageManifest = {
  apiVersion: 'packages.app.redhat.com/v1alpha1',
  kind: 'PackageManifest',
  metadata: {
    name: 'svcat',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink: '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/svcat',
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
    channels: [{
      name: 'alpha',
      currentCSV: 'svcat.v0.1.34',
      currentCSVDesc: {
        icon: null,
        displayName: 'Service Catalog',
        version: '0.1.34',
        provider: {
          name: 'Red Hat',
        },
        installModes: [],
        annotations: {
          description: 'Service Catalog lets you provision cloud services directly from the comfort of native Kubernetes tooling.',
          categories: 'catalog',
        },
      },
    }],
    defaultChannel: '',
  },
};

// A dummy package manifest object
const dummyPackageManifest = {
  apiVersion: 'packages.app.redhat.com/v1alpha1',
  kind: 'PackageManifest',
  metadata: {
    name: 'dummy',
    namespace: 'openshift-operator-lifecycle-manager',
    selfLink: '/apis/packages.apps.redhat.com/v1alpha1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/dummy',
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
    channels: [{
      name: 'alpha',
      currentCSV: 'dummy.v1.0.0',
      currentCSVDesc: {
        icon: null,
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
    }],
    defaultChannel: '',
  },
};

export const operatorHubListPageProps = {
  loaded: true,
  loadError: null,
  operatorGroup: {loaded: false},
  catalogSourceConfig: {loaded: false},
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
      iconClass: null,
      imgUrl:  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAlywAAJcsBGkdkZgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7d13nBx3ff/x13d29/aK6kmyyjXJlnVqLpJV3ABL2GAnuIANJAZDjGkmIWCn0H4ktCTEgfwI5AeEOPyMSRwTmktiwJIlGVu2ZEkWtnxFXbrbu1M9lWtb55s/7k7tdu+2zMx3y+f5ePDgbnZn5i1Zn8/07yhEQWuvpWLAx+yETb22qFM2FwHVKKYA1RqqFVQD5UAQqByatRyoGPp5AAgP/dwHRIEBBd02dCtFNzbdQLe2OKxs2i0fbZVxDtaFGPDsDyscp0wHEGPbehWBiqNc6oNFGhYDC4E5KOrRTDMc7zDQBhwAmhQ0KYs3Og+wZxXEzUYTY5EGkGd2zyUYi7PEslmpFSvRXAbMA8pMZ8tQFEUrmh0KXlE2m+IT+d2iJqKmg4mzpAEYtnsG02IBVqO4RmlWoljC4K56MQoDr6LYrDQv6QTrF3Rw3HSoUiYNwGPrwT+jniuAW4F3AEsAy2wqY2xgu4K1NqytsHhxzoEz5yKEB6QBeGDPJVwUi3GH1tyhFDdw9uSbOF8fsEErfumL8WRjJ8dMByp20gBcsmMWdX4/tzC4pb8Z8BuOVGgSwCYFP1U2P2sM0WE6UDGSBuCgvRczMRrnvcAfAVcjf79OsTW8hOKRQICfXrqH06YDFQv5B5ojDdaueq614R7gfUCV6UxFLgw8Dfx4fhvPqME9BZElaQBZ2nMJF0XjfEzZfBhFvek8JeqA0jzsi/GDSw9x1HSYQiQNIENNs7nSsrmfwS2+nMzLDxEF/4XNN+aHeN10mEIiDSANGqzWBu5A8yngzabziFGtU5pvN7bztBq8zChGIQ1gFBqsnfXcacOXFSwwnUdkpFnD3y9o4z/kPEFq0gCSGC58DV8FGk3nETnZB/z9oTZ+KM8mjCQN4BwarNZ67tHwRQWXmM4jHKTYpTRfbWzjMTk0OEsawJCmet7qg29ouNJ0FuGqV5Xiz+cfZL3pIPmg5BvAztnMt22+ArzbdBbhqbVa88DCdt4wHcSkkm0Au2cwLV7GV4H7kNt0S1UMzQ9szV8tCtFtOowJJdcANKiWeu5Rim/kwWAaIj90A5+b38a/KtCmw3ippBpAUy1zLYvvATeaziLy0m99io/PO0iL6SBeKYkGsPUqApVHeVDBlynewTaEM2IK/tFXxl9fuoeI6TBuK/oG0FLPVRp+LDfyiAy9Yfl4f+N+XjMdxE1FOxKNBl9zPZ8BXpLiF1lYbCfY0lLPlzT4TIdxS1HuAbTMZjY2P0Lu2xfOeNm2+cCiEHtMB3Fa0e0BNDdwHzY7kOIXzrnGstjWXM8HTAdxWtHsAeyfTXkkwT9rxX2ms4jipeDHvXE+vqyTftNZnFAUDaCplrmWj5+judx0FlEStvvgrnlt7DMdJFcFfwjQUs87LItXpPiFh5YkYHtzA+80HSRXBdsANFgt9fwd8BQw2XQeUXImKM3PWur5si7gPemCDP7adKoCQf5Dwe2mswiB5hd9Ce4pxPMCBdcAmhuYqTRPActMZxHiDMXmuMXtl+3nsOkomSioBtBcx2Kl+G+gwXQWIZLYb8M7FrXRbDpIugrmHEBLHW9Xio1I8Yv8NccHG1sbWG06SLoKogE01/FeFE8DE0xnEWI0GiZpza9a67nLdJZ05H0DaK3n/Urx70DAdBYh0lSm4fHWOu41HWQsed0AWuu4X8OPkBF7ROHxacW/tdbzKdNBRpO3DaC5ns9oxXfJ44xCjEFp+FZzA180HSSVvLwK0FrHV7TK3780ITIV1vxoSTt/ZDrHhfKuATTX8YBS/KPpHEI4pc+GfhuC8JuVndxsOs+58mr3uqWBP5HiF8VkuPgBIvD2TbX83Gyi8+XNHkBLPR8EfkieNSUhsnVu8Z8rqHh0ZQcf9D7RSHlRbC0N3Ak8TJ7kESJXqYofIKL5wNZa/snbRMkZ3wNoqePtQzf5yHV+URT67cEGMJYKi88sD/GQ+4lSM9oAmupZ6IONGiaZzCGEU0bb8l9IgQ5a3LUixC/cTTVqBjOaZjPDstmE3NsvikQmxT9MQSJYxrIVB/idO6lGZ+SYu72WCkvzBFL8okhkU/wwOHx9PMaLv51h5jV1njcADVav4j/QrPR63UK4IdviHxbXVPl9vLbVwHkwzxtAaz1/gyr8sdSEgMHCz6X4h8U1MxO1PJf7kjLjaQNoqedW4DNerlMIt/SlebY/XRGbN71Sw1edW+LYPDsJOPRm3q3ARK/WKYRbct3tT8UCXWWxekmIDc4vfSRPGkB7LRW9FhuBJV6sTwg3uVX8w3wQrlbULujguHtrGeTJIUCvxXeR4hdFwO3iB0hA+UnY5O5aBrneAJobuA/y7zFIITLl1Am/dMQ0c7fU8i9ur8fVQ4Bd9VycgN8B491cjxBu82LLfyELtGWx6toQz7u4DndosBLw/5HiFwXORPED2KCweaoJytxah2sNYGcDn0de0S0KnKniHxaHCb01/NKt5btyCNDcwFKleRkXO5cQbjNd/OeqtHjfshCPOb1cxxvA7rkEY1G2K1jg9LKF8Eq6j/R6xacI63FcdP1OepxcruOHAPEon5fiF4XM6Tv8nJDQlAd6nT8UcHQPoKWGefh4DSh3crmidCl/AFVZ5dn6eqMx+nr7PFtfJhQQgLdf3cmzTi3TsRduaFCtPr6HFP9ZPh/THvgyE+68B6tKLoZkyo5G6T64D6thrmfrnAzEDnVw5Oufo2fDrz1bbzo0YCse1zBFDf6aM8f2AFob+JDW/JtTyysGk+/9U6Z/KS+Gfis4diTM0abXsermGFm/Dg+w55alJE64fjduxip8fH95O/c7sSxHzgHsnsE0rc2ObZaPxt2QV0PAFww7EuZos7niB1DlFZQvutLY+kcTSfDRjXVc4sSyHGkA8TK+BkxxYllFxS/jnGbKjkYGt/y15op/mMrT/342WH7bmfcL5NwAdjWwAPiQA1lEibOjEY6+8ZrRLX+hiGiu2DqD3891OTk3gLjNN5G394ocSfFnLmrxcK7LyKkBtDawWiluyTWEKG2Du/1S/JmKw4wtNTyQyzKybgAaLK35h1xWLsSZ4s+DY/5CFNX8jc5hDzzrGVvruQdYmu38QtjRCEebd2RU/InOdnr37kTrs5fBA8EgVSveBOr8q9p2z2l6XtuCtgdv67MZfL528tKVWJXjHPkzmJaAii2z+Bad/Ek282fVADT4WhWfd+ZWBFGK7GiEY807sGoyezVEZ9PrHKmeMWL6ZbubKZu36Lxpp7dvYm/VyItTeusmpr75xswC57GY4iNN8OAiiGY6b1aHAK31vB/NvGzmFWJ4t19lWPwAWiW/d03HRv7bt+3kN/TbdiLj9eazhKasdxbfzGbejPcANPha4XPZrEyMLXHqBD1NvyMeiVBWNY5xly3Fqqgce0at6dy4gZOhNnzBINMXLGbS/MXuB86Q6Tv8ilVc8dGt8OAyiGUyX8YNYGc9fwg0ZjqfGNuJjeto81WQKJ945omKwLYtzKkqZ9yS1C9S6m0/wLZ1axmYXguTpgOwf387U15+kaXvuxdfWdCL+GPyuviLazs/uoSmzK7jIdozuyqQ0SGABp+GL2QWTaSj59VN7C+fSOKCYo1VjmdPVBPZtzPpfIlImC3Pbxgs/nMpxfGZs3n1sUdcSpwZE7f32iV2jipmc3+mVwQyagCtDdwOzM8olUhLx6meEWexh9mBMg7tbEn62f5fPUlk6siTYsO6p9dzet8uRzJm60zxy6U+VyU0wc01/HUm82TUAJTm05lFEumwe3vonzj6oxSnxk9OOr37xIlR59NKceSN17LOlispfm9p+EQm30+7ATQ1sETDmzKPJMaUYst/Lq2S/6dKdVb8vO8YOustxe+9mKZ6aw3vTvf7aTcAS/Op7CKJsVhV4yjvH32ot/Gnu5NOn1A19mg51XO9P2rzuvjzbAQvo+Kk/4LRtBrA7hlMA96bdSIxppnWKGesbJvpNTVJP7rk5tvw95xMOeuEroNMWeztc+0mtvyldsJvNDFN49ZZ6Z2rS6sBxIJ8HBnqy1WTr72BmpOHRwzRZCXizOk/QdXly5LOVzZ+Aksa5+E/NXIPoepIB0tvfacLaVOT3X7zNJCwSGsoqjEvGWiwWm0+7N2LxEvX9NW3MOnAHk7t3UU0FiPos5i08HICNStGnW/K5Uu54ZJ57F/zDKdOdmNpmFpbR/377wXLk/e/AsPFn9m9/cIdMZvVGnxqjNshxmwALfWsVlDvXDQxmuDsuVw0O/NBMP1V47j0jve4kCg9djTC0ZY3sGpnG8sgzrLBv6WWPybEt0f73pibB6W517lYohglImGOtTZl/GBPVlLtiaa4SpL0qxl8t5AlNJ8c6zuj7gHsvZiJ0Th3OBdJFJtEJMzxnc2omXWerG/arFp8HaHzpvksReXlbx3x3eoFlxFPcg/EpCtK4yn2hOaSrVOZuewYXam+M2oDiMb5AyCNJ1FEKbKjEY61vOHNln9IxYLLqVlweVrfDcyooWZG8qsnpcAGlSjna8B9qb4z1r7QB52NJIpFIhLm2M5mT4tfZC6huXO0z1M2gN011AJXO55IFLxEJMzxXS2oGbVjf1kYFddM3NqQeuSulA0g4eNOXHp9uChcg8XfKsVfQOJx/iLVZykbgIZ3uRNHFKqzxV+6x9WFSMPbUn2WtAHsmMN04DrXEpUKXTz3pybCw7v9JVT88bjpBI6Iaao31yQfwi9pA/AnuAPwuZqqBERTDOJRaBLhMMd3l9Yxv45FCe98w3QM5yg+k2xy0gagNbe7m6Y0HP/u14kd3Gs6Rk5KsfjtgX4OffXPiR89ZDqKY2w7+WvERpzk2z+b8rDNceT6vyNUeQWVV12LNanadJSsxI8dIRI64Mm6Jj76LNbE5AOfZOPkzx7l+CPfyXi++KFOdDyjsTXzngIdn8yEVU30njt9xI1AAzbXKyl+x+jwAH0bnzMdI+/12TAh4dzAJaeeeIxDf/uXkGJo8FKjQY0/xb3AeR1xxCGABTd5lkoIBou/38E6PfXEY3R95UEp/gvENSOeFhvRALQ0AOEhx4v/yf+U4k/BhhEjw5zXAHbOYipwhWeJRElzvPifepyuLz8gxZ9CXDNuSz0XnzvtvAag/ay+cJoQbuh3o/i/9Gkp/jHYcT527u/nnQTUcvOP8IDTW/7Tv/4lh2TLnx7FqnN/tS74MPX7p4RwgOPF/5sn6Po/f4x28ApCMUvo81/rd6YB7J5LED3yJIEQTnGl+L/wCXSR3LLrhThM2Drr7GX+Mw0gHmMpkB9vkRRFx/Hif/ZJKf4sxdXZMQLONABty7P/wh2uFP/n75fiz5KCW4d/PtMAlMVyM3FEMXP6bH/Pmqek+HOkFVcN/3z2KoDmMiNpRNFyesvfs/ZpOj/3cSn+HCVsZg7/bAFsvYoAJH9eWIhsuFL8n/2YFL8DbKhogjIYagAVR5nH0AQhcuV88f83nZ+VLb9TNBCZxZthqAH4YJHRRKJoOF78z/3P0Ja/uB7PNc1WrIahBqClAQgHuFL8n/moFL8L4rAMzp4EXGgwyxmBmgamfOqLBOctRvnHfG1hehIJEr2nnVlWnosdPczAxGrwBzxbp338CJGnH+fkmqdzLn5tn72br3fdM1L8LtJD5/yGq8z461ytikrqf7KeQJ3xKAUp3Laf3mk1+Kuner7usutv4tTA++G3z+a0nJO/+HemfviBwTv8vvhJKX4X2ZpqGBoSrKWeo4D3/3LOUXn1DdT/ZL3JCAUr3LafUwNhLAPFP+zUMz+n6/P3G1u/yIwFies78VtD9wUbLX4A38RJpiMUpEhHG6cGBowWP4Bv3Hij6xeZscG3aS4TrPFl1JsOI7IT6WjjZG8vVvU001FEAfKFWWrZCeTtjgVIil/kSimWWijZAyg0UvzCCVqz0FKai0wHEemT4hdOsTUz/dqimuJ5hV1Ry6b47eNHSJzsPjvBsgjUzobAyDu/dW8P8cMd503zT69ByQm+oqSh2s/Q9UCR37Ip/sTRQ7y+/yC27/ybqmbsXUPNjSPfFNX66lb6qyacN62iaxsLr78hq8wiv2mYZIE0gHyX7W6/ffrkiOIHiFjJ7xQMV47c0g9UjC+qtxyL84y3gCmmU+TEtol1hYgd6cp41oGjhzmxu4Vob48LwZwRbtsnx/zCFTZU+QHn3sbosRMvP0+HVUY0MDiUYXD3bmpUgknXrhp9vl0t7Nj0Ev0XDb3rfvc+Jh3t5Iqb30HF9JmjzuulcNs+TvUPYE2R87TCBZpyiwJ9EejhF9ayPzj+TPEDRCrGsa98IsfWPZNyvpN7drKlZefZ4gewfJycXsdL69YS7j7mZuy0SfELt2mFz6IABwKJHNxLZ1XqUxft46cST3FIsOPF57GD5Uk/i02eRuszTzqSMRdS/MITGlWQDeDUvt2jXrnUPj89O5tGTI+e7KZ/et2oy+72mR0Z3WTxy6m+0qLBKsgGkEjjLTCxgf4R0yInutFKjb7s8oqsc+VKtvzCY4W5BxAsT74Lf953KqtGTKusqUNFI6POV9ZzIutcuZDiF15TDA4JVnANYOKiK/GNMlhE4PQJxi9ZMWK6ryzI1O5Doy57ZuXYzcVpUvzCBHtoD6Dg+CZPYQ4xVGLkKLG+yABzxldiVSW/fXXx7XdRfqQj6WeTQnuZ9667Hc06Fil+YZIfiALeb/ZyNGHF9SzY1cyRPTvpq5yATsQZ13+a6YuvIDgn9SsOgpOncN0dd7Hr6Z9xNAGJsnICfT3MmjyBuR+6f+i0iDek+IVJFuiCbQAA5fMWUj8v8/FMAxMmsuh997mQKH2RjjZjxS8v0hYweNXHYrABCA9FOto42dNjbMsvl/vEkDN7AMIjXha/f0YtE9teYqB83JlpWttMspK3gOoThzk97vw7wyf0nYAxLp2KwqTAlgbgIa+3/KpqHHNXvS3t78++aeQjwqJ4WQrbAvpMBykFpnf7hbiQ1iQsBd1jf1XkQopf5COlCFu2NABXSfGLfKUUfRaa46aDFCspfpHnTsshgEsiHW2cPC3FL/KXBSf9gJmnXy4QP3rYdATHhNv2caqvH2vqdNNRPBM/3Gk6gsjcCUtbHDGdAiD8+hYGtm8yHSNnpVj8id7TnHjsX03HEBlS0OVXNm3kwX0eOh6n/Q/fyqS7P0rZJfMzvvlk3E234Z82w8E8Mbr/9R8znEnT130Myr0fZS2mIW7gFr/4scP0PPc/xA4lf8BK5C+taVatc2jUCVpNh8lV2cWN1D++Dv/0WY4sz+7vY9eCcWN/MQ/02dBvm04hCk25xQ1WVYw2iuD28Oi+nbT9weqSOxaV4hfZ6pvINqsuxACK/BgKN0el1gSk+EW2FCRWNdE7+PC75qDhPI4plSYgxS9y4YN+GHwcGA37zMZxVrE3gX4pfpEjyxrc67cAFLSYjeO8Ym0Cffbg/4TIhYLdcLYBvGE2jjuKrQnIbr9wiqXZCkMNwFKMfItGkSiWJiDFLxylWANDDaDjILuB0QfML2CF3gSk+IXTVIiNMNQAVkEc2GU0kcsKtQlI8Qun+RX9yyAGQw1gyOuG8nim0JqAnO0XblBwpgCscya+YiaOtwqlCcjZfuEWv2LL8M9nG4BN4T+Kl6Z8bwKy2y9cpXhq+MczDaBnOtuBASOBDMjXJiDFL9zW284Twz+faQDLthEDthtJZEi+NQEpfuE2v+LkKggP/37+i/BU6RwGDMuXJiDFL7xgcf6j//5zf1Galwv+ueAsRPftpO3uGwfHE3BwUBGASe+9jwnvugerKvXYAjZgl+Jf/Fi05ljLDnwz67xbpW0T6zjIsR98k+jenZ6t1ys+WHfu7+cNu9NSwxR8HOHCPYMSUTZ3wZkmEGl5nf03X5HT8ia+6x5m/t9HHUpXYrQmtO5XBC9fbmT18eNH2X/HtSR6ThlZv1vGBZm9dP/Zp3/PK/QFHRwHXvU8VZ6I7mnh4G0rOfS5j9H+gZtzXt74W+50IFUJ0pqOdb82VvwA/inTqLjqGmPrd4MPes4tfki+pV/jUZ68FOts4+RjPyB+pCvnZanKKgcSlRit6Vj3K8ouX2Y6yaiHbYXIr0Zu3Ec0AKVKuwEIg84Uv7ktfzFT8JMLp41oAIlxbEReGCq8NrTbL8XvDgXamsGPLpw+ogEsaiIKbPAilBDAOcVvfre/WAUUh5ZtGxwG7FxJz/ZrxS/djyQEg8W/XorfbZbi6WTT/ckmqjhP4OP7qT4XwhFa07HhWcouS7/4dSRMOHTgvGm+iirKZiW5V0Brwvt3o/XZO6wsn59gwyUZv3im0CmLv082PWmBL+jgeEs9LwCrXE0lSpfWdDy/hrLFSzOaLfTCcxyZfMHNWid6WRyNEpx9yXmTu19az/7yiSOWcXHXb5l8zVsyjlyoAopjy9uSD/yb+oYfxS9cS1QiEnJ3X3Ja07H+N5QtWpLxrFGdZMutFPHe0yMmx6LRpMuIRcJJpxcrBb9O9VnKBmAl+CWDd6mKLPTZ2f/lRQ510tP8OtEM35gc6+vl8PYtHHvjNexono7wpjWd639D2WVXmU5SMvxBHkr5WaoPGkN0NNfzkoLr3YlVvLIdyadv707a9++jv3rozcIH2xn3ykvUX7GU8tqGlPPZsSjbHnuE7snT0WVBAFRzM3U+zcI7787mj+Cazg3PEpDi94xfcWLZPnak+nz0e/7VyOuGYnTZjuQzcGAvu492ny1+AMuid2YDu3bvIXY89VvcNz76Q45Prz9T/AB6wmTaqqrZ8ZMfZx7GJZ3rf0Mgw2N+kRu/4qejfT5qA9D9PA70OpqoiOXySG/7rlbscwr4XPGJk+nY9GLSzw5uWENfzeyUy+0oH09/hocSbpDi954FOhbji2N8J7VFR+lVyD0B6cil+O3wAH1TRn8M+XTlhKTTO/ftGX3hwXI6trycXTCHdG54VorfAL9i93WHSb3rSDqP/SoecSpQscp1MA87EkGPcV3aLq9MOj3O2Nezo2FzZ707NzxLIIuz/SJ3Ps23x/rOmA2g8SDrKbKXhzrJiZF8/BMn4YuNftY+cPpE0umVwbIxlz9hurODnKSrc8MaKX5DfIrYsk6+N9b3xmwACrTS/NCZWMXFyXH7p/SNPvDEtIrk5wcufdMqiCW/3g3gP36E2qvflFO2bHQ+v4bAois9X68Y5IO1Ko0r0WmN/KMS/AslNGJwOpwet3/W9asYd+Jo0s8mH+3gojffmPSzCfVzmOPTkIiP+Ez1nuaKK69E+XzOBU1D5/NrCCyU4jfJVvxpOt9LqwE0dnJMaR7LLVLxcGMAT6ssyLxVN1EX6WHcyWOU9/cw/lgXs+MDzHn7raPO2/h7t7N0dj3jD7fjP3GMwLHDVB/t4Pq3vIVpiy53NugYun67VorfsCA0XRtijLPDg9J+2MeGbyn4EKRx1qmIuTp6r2Ux7Zq3MC2LWS9adDkXeVzsF+p6YR3+BbmNoyhyZ/n4QtrfTfeLC9t5gxIfJ0CG7k6t68X1+OdfZi5AJk/3FfGTgAHFseXtPJnu9zN63Fdp/kmr0nxCUF7UmVrXxg34Gxd7sq7JleWEe06COrvtCsTClC9bOeK746bPpPLwUWzr7DkQlYgzvq7Wk6wm+BTfyeT7GTWAxnaeaq1nB2Cw1XtPtvypdb2wztMtf/V1q6lO87tVC69gwUJX4+QVnyK8PMTfZDJPRuP/K9Ba87eZxSpsUvypdb3obfGL0fkV31GQyGSejF8AsqCd/wLeyHS+QiTFn1rXi+vwN0rx5wtLEVkR4vMZz5fpDApspfh6pvMVGin+1KT480/A4rsKRt4MMoasXgHWeJDHgeJ7cdoQKf7Uul5cL8WfZ3yKyIp2/jKbebNqAAoSCr6Wzbz5Ts72p+bl2X6RvoDi+9ls/SGHl4A2tvEYsDXb+fOR07f3Ro8ccm5hhh3a/CL+eYtMx/BU/FCH6Qhj8kPv8hAPZjt/1g1AgY3Nn2c7f75xY7e/85H/hx7lQZ1C0fXy8/gubjQdw1N9r7xA//bNpmOMKQCfTeehn1RyviWqpZ4ngdtyXY5Jbh7zV81fzNRb30PZ1OljfzkPhY8eou/4MU/WNfUjD2I5+ELVeFeI07/ObDwbnUgQ2dtKz5qn0fGYY1ncELAIXRMiyQsR0pdzA2idQ6NOsAMI5LosE+SEX/64dF0zvuqpjiwr1hWi7SPvJBY6OPaXC1QF3LS8k7W5LCPrQ4Bh8/ezE80Pcl2OCVL8xakUir8MtuVa/OBAAwCwNX8Fo489lm+k+ItTKRS/BbYu4y6HlpW7RSG6NfyFE8vyghR/cSqF4gcos/jONQc44MSyHGkAAAvbeBRy3yVxmxR/cSqV4g8ojq0I8WmnludYAwDQNp8A8vbFa1L8xalUih+gXPFuJ5fnaANYGGI38HdOLtMpUvzFqcSK/1dLQs4OyuNoAwCwx/N18uxpQbm9tziVUvH7YMCa4cyJv3M53gAWNRG14Q/Ik0MBp2/vFfmhlIpfAWUW9yzbRr/Ty3a8AQAsaqNJw1+7sexMyG5/cSql4gcos3hieYifu7FsVxoAwII2voE2N4ioFH9xKrXi9ytOrgg5v+s/zLUGoMD229wDJH+nlYuk+ItTqRW/BdqCWzId5ivDdbjn0g5CGueuWaZDTvgVp1IrfoAA/PPVHWxycx2uNgAYvEFIwcNurwfkhF+xKsXiL1PsWNmZ3uu9cuF6AwAIWnwS2ObmOmS3vziVYvH7FX3xcVznxbo8aQBzDhDWPu4EXHmwXIq/OJVi8SvQQZtbrt9Jjxfr86QBACzcz0ENd+PwCQ0p/uIU7wrRdt/tJVX8ABWKv7qqixe8Wp9nDQBgYRtrILM3l4xGTvgVl/CuJgBine0cvO92Yp3thhN5q1zx3LIObwfb9fwtiRpUax3/juLuXJYjW/7iY1VUUrnsOgZe30rilOdXj40KKNqv7mCOm5f8kjHyXdGzvgAABdxJREFUmtT9sykP26wDrslmfil+UUx8it7xPuovb/P+nhlPDwGGzTlA2IpzG7An03ml+EUxsSBebrPCRPEPrd+Mxk6OWRa3ksGdglL8opgohQ7Y3HFVFy2mMhhrAACNB2hViruAMQfPlxN+otgEFZ9eeYj/MZnBaAMAmH+QdVrzXkZ5tZHc4SeKTdDioRUhvm06h5GTgMm01vN+DT/igqYku/2i2JQrfrCig4+ZzgF51AAAWhv4kNY8zFAuKX5RbMotHlsR4n2mcwzLqwYA0FrPpzR8S4pfFJug4pmVHfy+6RznyrsGALC9jkd6EnzQdA4hnFKmWHd1B281neNCedkAAF6p4cmwLuyXjgoBELT4zcoQN5vOkYzxqwCprOjg9qDFf5rOIUQuyhSP52vxQx43AICVIe4uh++aziFENsotHr66gz80nWM0ed0AAFZ08sdBi4dM5xAiExV+/mFFiI+YzjGWvD0HcKHNNTwQ03zTLqDMovQo0AHFg1d38C3TWdJRUMW0ZQa3RH08mdAETGcR4kI+RaxMccfyEM+YzpKugmoAAC/PZIG22BzXjDedRYhhfugJalaafLAnGwXXAAC2XszEWITXYpoG01mECChCExRXLArRbTpLpgqyAQBo8G2exfoovMl0FlG6yhXPLe/gbQoK8r7VvL8KkIqCxNWdvLnCxxcUaNN5RGmxQFcovrCigxsLtfihgPcAzrWphqttWBvXVJnOIoqfX9EftLnZy9F73VIUDQCGzgtEeTFms9h0FlG8Aha7A2UsX7aPU6azOKFoGsCwLbX8S1jzEa2L788mzLFAB+CfvXhdl5eKskhebeCacJxn4ppJprOIwudXnKrQ/N6STl4yncVpRdkAADRYr8ziZ1F4p5whFNlQQFDxq+Ud3KZGGbKukBXsVYCxKLBXdvKuCsV7fIqw6TyisPhgoMzHO1d08HvFWvxQxA1g2LIOfqoU1eWKp01nEYUhqHhej2f6ynaeMJ3FbUV7CJDM9lpuCGt+GtNMNZ1F5B8/HA8q3nNVB+tMZ/FKSTWAYVtq+XrE5i/sEtgDEmOzwA5aPLw8lB8j9XqpJBsAwMY6LvHb/DyiucJ0FmFO0GKbr4x3LdtHm+ksJpRsAxi2ZRY3xRU/jGlqTWcR3gnA4TLF3aW0u59MyTeAYZtm8Qlb8ZDcTlzc/Io+n+ZzKzv5juks+UAawDk0+LbM4tsxxYcTmjLTeYRzfIpIQPH95SEeLOSHd5wmDSAJDf6ttXwtqvlUQlNuOo/InqWIBBU/qgzxyUVpvIS21EgDGIUG35YavhSHB+OaStN5RPr8inBA8agK8SfLIGY6T76SBpAGDb7NNXxJwydimmrTeURqAcVxn+Lby0N8TXb1xyYNIENbZ/G2uOKhqFw+zBsKCFjs8yv+bFkJ3L3nJGkAWdpcwzwU34nZrLbBbzpPKbIUMT+sTVh88rp29prOU4ikAeRIg7W1lnsTmj+La+bLewvcF4CDfovvLgvxDdnNz438Y3XQ1qnMTJTztYTmzrhmouk8xcSvOOFX/DQW44vXHeaI6TzFQhqASzbXMM9S/Fnc5vYYTDedpxD54bQPnisr4ytLDvA703mKkTQAD2yq5VIFn7Vtfj8BF8lhQnIWaL/ikKX4b+3j71YeZL/pTMVO/iF6bDcET9TybjR3x2FlvMQvK/oU/X543VL8MlLF967fSY/pTKVEGoBhmxuYQ4yPoVid0DTGYYLpTG4KKE4paPXBc7qc76/YS7vpTKVMGkCeeamWCgvuVJrbtOKqhGamrakoxHEN/Yp+BZ0+2KosnprUzi8uhYjpXOIsaQAFoAnKIrN4cwxu1IqlGubZmmoNlTb4TGZTkPBBv1IctzS7lGKbD9bqDl6QW3DznzSAAvdiI+MrelmuLa5MaBagmQVUa5ikYbwNVWjKUYONQmt8eui/+/D/K4Ue+kUrRYLBDxNKMaCgX8Fp4JRSHFfQqTUtlmJ770S2rmqi19AfXTjgfwFVFcHePttw0QAAAABJRU5ErkJggg==',
      description: '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
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
    },
    {
      obj: etcdPackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'etcd',
      uid: 'etcd/openshift-operator-lifecycle-manager',
      iconClass: null,
      imgUrl: 'data:image/png;base64,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',
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
    },
    { obj: federationv2PackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'federationv2',
      uid: 'federationv2/openshift-operator-lifecycle-manager',
      iconClass: null,
      imgUrl: 'test-file-stub',
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
    },
    { obj: prometheusPackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'prometheus',
      uid: 'prometheus/openshift-operator-lifecycle-manager',
      iconClass: null,
      imgUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQ5MCIgaGVpZ2h0PSIyNTAwIiB2aWV3Qm94PSIwIDAgMjU2IDI1NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+PHBhdGggZD0iTTEyOC4wMDEuNjY3QzU3LjMxMS42NjcgMCA1Ny45NzEgMCAxMjguNjY0YzAgNzAuNjkgNTcuMzExIDEyNy45OTggMTI4LjAwMSAxMjcuOTk4UzI1NiAxOTkuMzU0IDI1NiAxMjguNjY0QzI1NiA1Ny45NyAxOTguNjg5LjY2NyAxMjguMDAxLjY2N3ptMCAyMzkuNTZjLTIwLjExMiAwLTM2LjQxOS0xMy40MzUtMzYuNDE5LTMwLjAwNGg3Mi44MzhjMCAxNi41NjYtMTYuMzA2IDMwLjAwNC0zNi40MTkgMzAuMDA0em02MC4xNTMtMzkuOTRINjcuODQyVjE3OC40N2gxMjAuMzE0djIxLjgxNmgtLjAwMnptLS40MzItMzMuMDQ1SDY4LjE4NWMtLjM5OC0uNDU4LS44MDQtLjkxLTEuMTg4LTEuMzc1LTEyLjMxNS0xNC45NTQtMTUuMjE2LTIyLjc2LTE4LjAzMi0zMC43MTYtLjA0OC0uMjYyIDE0LjkzMyAzLjA2IDI1LjU1NiA1LjQ1IDAgMCA1LjQ2NiAxLjI2NSAxMy40NTggMi43MjItNy42NzMtOC45OTQtMTIuMjMtMjAuNDI4LTEyLjIzLTMyLjExNiAwLTI1LjY1OCAxOS42OC00OC4wNzkgMTIuNTgtNjYuMjAxIDYuOTEuNTYyIDE0LjMgMTQuNTgzIDE0LjggMzYuNTA1IDcuMzQ2LTEwLjE1MiAxMC40Mi0yOC42OSAxMC40Mi00MC4wNTYgMC0xMS43NjkgNy43NTUtMjUuNDQgMTUuNTEyLTI1LjkwNy02LjkxNSAxMS4zOTYgMS43OSAyMS4xNjUgOS41MyA0NS40IDIuOTAyIDkuMTAzIDIuNTMyIDI0LjQyMyA0Ljc3MiAzNC4xMzguNzQ0LTIwLjE3OCA0LjIxMy00OS42MiAxNy4wMTQtNTkuNzg0LTUuNjQ3IDEyLjguODM2IDI4LjgxOCA1LjI3IDM2LjUxOCA3LjE1NCAxMi40MjQgMTEuNDkgMjEuODM2IDExLjQ5IDM5LjYzOCAwIDExLjkzNi00LjQwNyAyMy4xNzMtMTEuODQgMzEuOTU4IDguNDUyLTEuNTg2IDE0LjI4OS0zLjAxNiAxNC4yODktMy4wMTZsMjcuNDUtNS4zNTVjLjAwMi0uMDAyLTMuOTg3IDE2LjQwMS0xOS4zMTQgMzIuMTk3eiIgZmlsbD0iI0RBNEUzMSIvPjwvc3ZnPg==',
      description: 'The Prometheus Operator for Kubernetes provides easy monitoring definitions for Kubernetes services and deployment and management of Prometheus instances.',
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
    },
    { obj: svcatPackageManifest,
      installState: 'Not Installed',
      installed: false,
      kind: 'PackageManifest',
      name: 'svcat',
      uid: 'svcat/openshift-operator-lifecycle-manager',
      iconClass: null,
      imgUrl: 'test-file-stub',
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
      imgUrl: 'test-file-stub',
      description: undefined,
      provider: 'Dummy',
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
  name: 'amq-streams',
  uid: 'amq-streams/openshift-operator-lifecycle-manager',
  iconClass: null,
  imgUrl:  'data:image/png;base64,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',
  description: '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
  provider: 'Red Hat',
  tags: undefined,
  version: '1.0.0-Beta',
  certifiedLevel: undefined,
  healthIndex: undefined,
  repository: undefined,
  containerImage: undefined,
  createdAt: undefined,
  support: undefined,
  longDescription: '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
  categories: ['messaging', 'streaming'],
  catalogSource: 'testing',
  catalogSourceNamespace: 'openshift-marketplace',
};
