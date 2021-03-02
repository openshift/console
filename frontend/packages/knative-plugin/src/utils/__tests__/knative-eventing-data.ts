import { K8sResourceKind } from '@console/internal/module/k8s';

export const subscriptionData: K8sResourceKind = {
  apiVersion: 'messaging.knative.dev/v1beta1',
  kind: 'Subscription',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"messaging.knative.dev/v1beta1","kind":"Subscription","metadata":{"annotations":{},"name":"sub1","namespace":"sample-app"},"spec":{"channel":{"apiVersion":"messaging.knative.dev/v1beta1","kind":"InMemoryChannel","name":"testchannel"},"subscriber":{"ref":{"apiVersion":"serving.knative.dev/v1","kind":"Service","name":"channel-display0"}}}}\n',
      'messaging.knative.dev/creator': 'kube:admin',
      'messaging.knative.dev/lastModifier': 'kube:admin',
    },
    resourceVersion: '43908',
    name: 'sub1',
    uid: '26152eb3-f36b-4b13-b26f-3ba165642b01',
    creationTimestamp: '2020-10-14T06:32:12Z',
    generation: 1,
    managedFields: [
      {
        apiVersion: 'messaging.knative.dev/v1beta1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:annotations': {
              '.': {},
              'f:kubectl.kubernetes.io/last-applied-configuration': {},
            },
          },
          'f:spec': {
            '.': {},
            'f:channel': {
              '.': {},
              'f:apiVersion': {},
              'f:kind': {},
              'f:name': {},
            },
            'f:subscriber': {
              '.': {},
              'f:ref': {
                '.': {},
                'f:apiVersion': {},
                'f:kind': {},
                'f:name': {},
              },
            },
          },
        },
        manager: 'oc',
        operation: 'Update',
        time: '2020-10-14T06:32:12Z',
      },
      {
        apiVersion: 'messaging.knative.dev/v1beta1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:finalizers': {
              '.': {},
              'v:"subscriptions.messaging.knative.dev"': {},
            },
          },
          'f:status': {
            '.': {},
            'f:conditions': {},
            'f:observedGeneration': {},
            'f:physicalSubscription': {},
          },
        },
        manager: 'controller',
        operation: 'Update',
        time: '2020-10-14T06:32:22Z',
      },
    ],
    namespace: 'sample-app',
    finalizers: ['subscriptions.messaging.knative.dev'],
  },
  spec: {
    channel: {
      apiVersion: 'messaging.knative.dev/v1beta1',
      kind: 'InMemoryChannel',
      name: 'testchannel',
    },
    subscriber: {
      ref: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: 'channel-display0',
      },
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2020-10-14T06:32:22Z',
        status: 'True',
        type: 'AddedToChannel',
      },
      {
        lastTransitionTime: '2020-10-14T06:32:22Z',
        status: 'True',
        type: 'ChannelReady',
      },
      {
        lastTransitionTime: '2020-10-14T06:32:22Z',
        status: 'True',
        type: 'Ready',
      },
      {
        lastTransitionTime: '2020-10-14T06:32:22Z',
        status: 'True',
        type: 'ReferencesResolved',
      },
    ],
    observedGeneration: 1,
    physicalSubscription: {
      subscriberUri: 'http://channel-display0.sample-app.svc.cluster.local',
    },
  },
};

export const triggerData: K8sResourceKind = {
  apiVersion: 'eventing.knative.dev/v1beta1',
  kind: 'Trigger',
  metadata: {
    annotations: {
      'eventing.knative.dev/creator': 'kube:admin',
      'eventing.knative.dev/lastModifier': 'kube:admin',
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"eventing.knative.dev/v1beta1","kind":"Trigger","metadata":{"annotations":{},"name":"testevents-trigger0","namespace":"sample-app"},"spec":{"broker":"default","filter":{"attributes":{"type":"dev.knative.sources.ping"}},"subscriber":{"ref":{"apiVersion":"serving.knative.dev/v1","kind":"Service","name":"broker-display"}}}}\n',
    },
    resourceVersion: '483312',
    name: 'testevents-trigger0',
    uid: 'f600e386-90d3-4405-a28a-9c96b7a286ab',
    creationTimestamp: '2020-10-14T06:32:53Z',
    generation: 1,
    managedFields: [
      {
        apiVersion: 'eventing.knative.dev/v1beta1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:annotations': {
              '.': {},
              'f:kubectl.kubernetes.io/last-applied-configuration': {},
            },
          },
          'f:spec': {
            '.': {},
            'f:broker': {},
            'f:filter': {
              '.': {},
              'f:attributes': {
                '.': {},
                'f:type': {},
              },
            },
            'f:subscriber': {
              '.': {},
              'f:ref': {
                '.': {},
                'f:apiVersion': {},
                'f:kind': {},
                'f:name': {},
              },
            },
          },
        },
        manager: 'oc',
        operation: 'Update',
        time: '2020-10-14T06:32:53Z',
      },
      {
        apiVersion: 'eventing.knative.dev/v1beta1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:status': {
            '.': {},
            'f:conditions': {},
            'f:observedGeneration': {},
            'f:subscriberUri': {},
          },
        },
        manager: 'mtchannel-broker',
        operation: 'Update',
        time: '2020-10-14T10:25:10Z',
      },
    ],
    namespace: 'sample-app',
    labels: {
      'eventing.knative.dev/broker': 'default',
    },
  },
  spec: {
    broker: 'default',
    filter: {
      attributes: {
        type: 'dev.knative.sources.ping',
      },
    },
    subscriber: {
      ref: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: 'broker-display',
        namespace: 'sample-app',
      },
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2020-10-14T10:25:10Z',
        status: 'True',
        type: 'BrokerReady',
      },
      {
        lastTransitionTime: '2020-10-14T06:32:53Z',
        status: 'True',
        type: 'DependencyReady',
      },
      {
        lastTransitionTime: '2020-10-14T10:25:10Z',
        status: 'True',
        type: 'Ready',
      },
      {
        lastTransitionTime: '2020-10-14T06:32:53Z',
        status: 'True',
        type: 'SubscriberResolved',
      },
      {
        lastTransitionTime: '2020-10-14T06:32:53Z',
        status: 'True',
        type: 'SubscriptionReady',
      },
    ],
    observedGeneration: 1,
    subscriberUri: 'http://broker-display.sample-app.svc.cluster.local',
  },
};

export const kameletSourceTelegram: K8sResourceKind = {
  apiVersion: 'camel.apache.org/v1alpha1',
  kind: 'Kamelet',
  metadata: {
    name: 'telegram-source',
    annotations: {
      'camel.apache.org/kamelet.icon':
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgMjQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIuNjY3IiB4Mj0iLjQxNyIgeTE9Ii4xNjciIHkyPSIuNzUiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzM3YWVlMiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFlOTZjOCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iLjY2IiB4Mj0iLjg1MSIgeTE9Ii40MzciIHkyPSIuODAyIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNlZmY3ZmMiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIxMjAiIGN5PSIxMjAiIHI9IjEyMCIgZmlsbD0idXJsKCNhKSIvPjxwYXRoIGZpbGw9IiNjOGRhZWEiIGQ9Ik05OCAxNzVjLTMuODg4IDAtMy4yMjctMS40NjgtNC41NjgtNS4xN0w4MiAxMzIuMjA3IDE3MCA4MCIvPjxwYXRoIGZpbGw9IiNhOWM5ZGQiIGQ9Ik05OCAxNzVjMyAwIDQuMzI1LTEuMzcyIDYtM2wxNi0xNS41NTgtMTkuOTU4LTEyLjAzNSIvPjxwYXRoIGZpbGw9InVybCgjYikiIGQ9Ik0xMDAuMDQgMTQ0LjQxbDQ4LjM2IDM1LjcyOWM1LjUxOSAzLjA0NSA5LjUwMSAxLjQ2OCAxMC44NzYtNS4xMjNsMTkuNjg1LTkyLjc2M2MyLjAxNS04LjA4LTMuMDgtMTEuNzQ2LTguMzYtOS4zNDlsLTExNS41OSA0NC41NzFjLTcuODkgMy4xNjUtNy44NDMgNy41NjctMS40MzggOS41MjhsMjkuNjYzIDkuMjU5IDY4LjY3My00My4zMjVjMy4yNDItMS45NjYgNi4yMTgtLjkxIDMuNzc2IDEuMjU4Ii8+PC9zdmc+',
      'camel.apache.org/provider': 'Red Hat',
    },
    labels: {
      'camel.apache.org/kamelet.type': 'source',
    },
  },
  spec: {
    definition: {
      title: 'Telegram Source',
      description: 'Receive all messages that people send to your telegram bot.',
      required: ['authorizationToken'],
      properties: {
        authorizationToken: {
          title: 'Token',
          description:
            'The token to access your bot on Telegram, that you can obtain from the Telegram "Bot Father".',
          type: 'string',
          'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
        },
      },
    },
    types: {
      out: {
        mediaType: 'application/json',
      },
    },
    dependencies: ['camel:jackson'],
    flow: {
      from: {
        uri: 'telegram:bots',
        parameters: {
          authorizationToken: '{{authorizationToken}}',
        },
        steps: [
          {
            marshal: {
              json: {},
            },
          },
          {
            to: 'kamelet:sink',
          },
        ],
      },
    },
  },
};
