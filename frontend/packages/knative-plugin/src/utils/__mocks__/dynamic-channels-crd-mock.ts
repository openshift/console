export const mockChannelCRDData = {
  kind: 'CustomResourceDefinitionList',
  apiVersion: 'apiextensions.k8s.io/v1',
  metadata: {
    resourceVersion: '300390',
  },
  items: [
    {
      metadata: {
        name: 'channels.messaging.knative.dev',
        labels: {
          'duck.knative.dev/addressable': 'true',
          'eventing.knative.dev/release': 'v0.16.1',
          'knative.dev/crd-install': 'true',
          'messaging.knative.dev/subscribable': 'true',
        },
      },
      spec: {
        group: 'messaging.knative.dev',
        names: {
          plural: 'channels',
          singular: 'channel',
          shortNames: ['ch'],
          kind: 'Channel',
          listKind: 'ChannelList',
          categories: ['all', 'knative', 'messaging', 'channel'],
        },
        versions: [
          { name: 'v1alpha1', served: false, storage: false },
          { name: 'v1beta1', served: true, storage: true },
          { name: 'v1', served: true, storage: false },
        ],
      },
    },
    {
      metadata: {
        name: 'inmemorychannels.messaging.knative.dev',
        labels: {
          'duck.knative.dev/addressable': 'true',
          'eventing.knative.dev/release': 'v0.16.1',
          'knative.dev/crd-install': 'true',
          'messaging.knative.dev/subscribable': 'true',
        },
      },
      spec: {
        group: 'messaging.knative.dev',
        names: {
          plural: 'inmemorychannels',
          singular: 'inmemorychannel',
          shortNames: ['imc'],
          kind: 'InMemoryChannel',
          listKind: 'InMemoryChannelList',
          categories: ['all', 'knative', 'messaging', 'channel'],
        },
        versions: [
          { name: 'v1alpha1', served: false, storage: false },
          { name: 'v1beta1', served: true, storage: true },
          { name: 'v1', served: true, storage: false },
        ],
      },
    },
    {
      metadata: {
        name: 'kafkachannels.messaging.knative.dev',
        labels: {
          'contrib.eventing.knative.dev/release': 'devel',
          'duck.knative.dev/addressable': 'true',
          'knative.dev/crd-install': 'true',
          'messaging.knative.dev/subscribable': 'true',
        },
      },
      spec: {
        group: 'messaging.knative.dev',
        names: {
          plural: 'kafkachannels',
          singular: 'kafkachannel',
          shortNames: ['kc'],
          kind: 'KafkaChannel',
          listKind: 'KafkaChannelList',
          categories: ['all', 'knative', 'messaging', 'channel'],
        },
        versions: [
          { name: 'v1alpha1', served: true, storage: true },
          { name: 'v1beta1', served: true, storage: false },
          { name: 'v1', served: true, storage: false },
        ],
      },
    },
  ],
};
