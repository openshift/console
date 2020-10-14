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
    selfLink: '/apis/messaging.knative.dev/v1beta1/namespaces/sample-app/subscriptions/sub1',
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
    selfLink:
      '/apis/eventing.knative.dev/v1beta1/namespaces/sample-app/triggers/testevents-trigger0',
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
