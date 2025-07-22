import { CatalogItem } from '@console/dynamic-plugin-sdk';

export const eventSourceCatalogItems: CatalogItem[] = [
  {
    uid: 'b0abb994-5057-4f7e-a4f3-d2f9b3295b97',
    type: 'EventSource',
    name: 'ApiServerSource',
    provider: 'Red Hat',
    description:
      'This object can be used to connect an event sink, such as a Service, Channel, or Broker to the Kubernetes API server. ApiServerSource watches for Kubernetes events and forwards them to the sink.',
    cta: {
      label: 'Create Event Source',
      href: '`/catalog/ns/default/eventsource?sourceKind=ApiServerSource`',
    },
  },
  {
    uid: 'b0abb994-5057-4f7e-a4f3-d2f9b3295b98',
    type: 'EventSource',
    name: 'Slack Source',
    provider: 'Red Hat',
    description:
      'This object can be used to connect an event sink, such as a Service, Channel, or Broker to the Kubernetes API server. ApiServerSource watches for Kubernetes events and forwards them to the sink.',
    cta: {
      label: 'Create Event Source',
      href: '`/catalog/ns/default/eventsource?sourceKind=KameleteBinding`',
    },
    details: {
      properties: [
        {
          label: 'Support',
          value: 'Community',
        },
      ],
    },
  },
  {
    uid: 'b0abb994-5057-4f7e-a4f3-d2f9b3295b98',
    type: 'EventSource',
    name: 'Slack Source',
    provider: 'Red Hat',
    description:
      'This object can be used to connect an event sink, such as a Service, Channel, or Broker to the Kubernetes API server. ApiServerSource watches for Kubernetes events and forwards them to the sink.',
    cta: {
      label: 'Create Event Source',
      href: '`/catalog/ns/default/eventsource?sourceKind=KameleteBinding`',
    },
    supportUrl: 'example',
  },
];
