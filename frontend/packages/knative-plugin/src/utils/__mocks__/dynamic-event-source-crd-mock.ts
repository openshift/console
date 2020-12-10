export const mockEventSourcCRDData = {
  kind: 'CustomResourceDefinitionList',
  apiVersion: 'apiextensions.k8s.io/v1',
  metadata: {
    selfLink: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
    resourceVersion: '300390',
  },
  items: [
    {
      metadata: {
        name: 'apiserversources.sources.knative.dev',
        labels: {
          'duck.knative.dev/source': 'true',
          'eventing.knative.dev/release': 'v0.16.1',
          'eventing.knative.dev/source': 'true',
          'knative.dev/crd-install': 'true',
        },
      },
      spec: {
        group: 'sources.knative.dev',
        names: {
          plural: 'apiserversources',
          singular: 'apiserversource',
          kind: 'ApiServerSource',
          listKind: 'ApiServerSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [
          { name: 'v1alpha1', served: true, storage: true },
          { name: 'v1alpha2', served: true, storage: false },
        ],
      },
    },
    {
      metadata: {
        name: 'camelsources.sources.knative.dev',
        labels: {
          'contrib.eventing.knative.dev/release': 'v0.15.1',
          'duck.knative.dev/source': 'true',
          'eventing.knative.dev/source': 'true',
          'knative.dev/crd-install': 'true',
          'operators.coreos.com/knative-camel-operator.openshift-operators': '',
        },
      },
      spec: {
        group: 'sources.knative.dev',
        names: {
          plural: 'camelsources',
          singular: 'camelsource',
          kind: 'CamelSource',
          listKind: 'CamelSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [{ name: 'v1alpha1', served: true, storage: true }],
      },
    },
    {
      metadata: {
        name: 'containersources.sources.knative.dev',
        labels: {
          'duck.knative.dev/source': 'true',
          'eventing.knative.dev/release': 'v0.16.1',
          'eventing.knative.dev/source': 'true',
          'knative.dev/crd-install': 'true',
        },
      },
      spec: {
        group: 'sources.knative.dev',
        names: {
          plural: 'containersources',
          singular: 'containersource',
          kind: 'ContainerSource',
          listKind: 'ContainerSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [{ name: 'v1alpha2', served: true, storage: true }],
      },
    },
    {
      metadata: {
        name: 'kafkasources.sources.knative.dev',
        labels: {
          'contrib.eventing.knative.dev/release': 'devel',
          'duck.knative.dev/source': 'true',
          'eventing.knative.dev/source': 'true',
          'knative.dev/crd-install': 'true',
        },
      },
      spec: {
        group: 'sources.knative.dev',
        names: {
          plural: 'kafkasources',
          singular: 'kafkasource',
          kind: 'KafkaSource',
          listKind: 'KafkaSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [
          { name: 'v1alpha1', served: true, storage: true },
          { name: 'v1beta1', served: true, storage: false },
        ],
      },
    },
    {
      metadata: {
        name: 'pingsources.sources.knative.dev',
        labels: {
          'duck.knative.dev/source': 'true',
          'eventing.knative.dev/release': 'v0.16.1',
          'eventing.knative.dev/source': 'true',
          'knative.dev/crd-install': 'true',
        },
      },
      spec: {
        group: 'sources.knative.dev',
        names: {
          plural: 'pingsources',
          singular: 'pingsource',
          kind: 'PingSource',
          listKind: 'PingSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [
          { name: 'v1alpha1', served: false, storage: false },
          { name: 'v1alpha2', served: true, storage: true },
        ],
      },
    },
    {
      metadata: {
        name: 'sinkbindings.sources.knative.dev',
        labels: {
          'duck.knative.dev/binding': 'true',
          'duck.knative.dev/source': 'true',
          'eventing.knative.dev/release': 'v0.16.1',
          'eventing.knative.dev/source': 'true',
          'knative.dev/crd-install': 'true',
        },
      },
      spec: {
        group: 'sources.knative.dev',
        names: {
          plural: 'sinkbindings',
          singular: 'sinkbinding',
          kind: 'SinkBinding',
          listKind: 'SinkBindingList',
          categories: ['all', 'knative', 'eventing', 'sources', 'bindings'],
        },
        versions: [
          { name: 'v1alpha1', served: true, storage: true },
          { name: 'v1alpha2', served: true, storage: false },
        ],
      },
    },
  ],
};
