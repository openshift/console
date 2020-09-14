export const mockEventSourcCRDData = {
  kind: 'CustomResourceDefinitionList',
  apiVersion: 'apiextensions.k8s.io/v1',
  metadata: {
    selfLink: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
    resourceVersion: '318530',
  },
  items: [
    {
      metadata: {
        name: 'apiserversources.sources.eventing.knative.dev',
      },
      spec: {
        group: 'sources.eventing.knative.dev',
        names: {
          plural: 'apiserversources',
          singular: 'apiserversource',
          kind: 'ApiServerSource',
          listKind: 'ApiServerSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'apiserversources.sources.knative.dev',
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
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'camelsources.sources.knative.dev',
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
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'containersources.sources.eventing.knative.dev',
      },
      spec: {
        group: 'sources.eventing.knative.dev',
        names: {
          plural: 'containersources',
          singular: 'containersource',
          kind: 'ContainerSource',
          listKind: 'ContainerSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'cronjobsources.sources.eventing.knative.dev',
      },
      spec: {
        group: 'sources.eventing.knative.dev',
        names: {
          plural: 'cronjobsources',
          singular: 'cronjobsource',
          kind: 'CronJobSource',
          listKind: 'CronJobSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'githubsources.sources.knative.dev',
      },
      spec: {
        group: 'sources.knative.dev',
        names: {
          plural: 'githubsources',
          singular: 'githubsource',
          kind: 'GitHubSource',
          listKind: 'GitHubSourceList',
          categories: ['all', 'knative', 'eventing', 'sources'],
        },
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'pingsources.sources.knative.dev',
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
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
          {
            name: 'v1alpha2',
            served: true,
            storage: false,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'sinkbindings.sources.eventing.knative.dev',
      },
      spec: {
        group: 'sources.eventing.knative.dev',
        names: {
          plural: 'sinkbindings',
          singular: 'sinkbinding',
          kind: 'SinkBinding',
          listKind: 'SinkBindingList',
          categories: ['all', 'knative', 'eventing', 'sources', 'bindings'],
        },
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
        ],
      },
    },
    {
      metadata: {
        name: 'sinkbindings.sources.knative.dev',
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
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
          },
          {
            name: 'v1alpha2',
            served: true,
            storage: false,
          },
        ],
      },
    },
  ],
};
