export const mockChannelCRDData = {
  kind: 'CustomResourceDefinitionList',
  apiVersion: 'apiextensions.k8s.io/v1',
  metadata: {
    selfLink: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
    resourceVersion: '157889',
  },
  items: [
    {
      metadata: {
        name: 'channels.messaging.knative.dev',
        labels: {
          'duck.knative.dev/addressable': 'true',
          'eventing.knative.dev/release': 'v0.14.2',
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
          { name: 'v1alpha1', served: true, storage: true },
          { name: 'v1beta1', served: true, storage: false },
        ],
      },
    },
    {
      metadata: {
        name: 'inmemorychannels.messaging.knative.dev',
        labels: {
          'duck.knative.dev/addressable': 'true',
          'eventing.knative.dev/release': 'v0.14.2',
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
          { name: 'v1alpha1', served: true, storage: true },
          { name: 'v1beta1', served: true, storage: false },
        ],
      },
    },
  ],
};
