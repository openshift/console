import { K8sResourceKind } from '@console/internal/module/k8s';

export const eventSinkKamelet: K8sResourceKind = {
  apiVersion: 'camel.apache.org/v1alpha1',
  kind: 'KameletBinding',
  metadata: {
    annotations: {
      'camel.apache.org/kamelet.icon':
        'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE2LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTQ0OCwwSDY0QzQ2LjMyOCwwLDMyLDE0LjMxMywzMiwzMnY0NDhjMCwxNy42ODgsMTQuMzI4LDMyLDMyLDMyaDM4NGMxNy42ODgsMCwzMi0xNC4zMTIsMzItMzJWMzINCgkJQzQ4MCwxNC4zMTMsNDY1LjY4OCwwLDQ0OCwweiBNNjQsNDgwVjEyOGg4MHY2NEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY4MEg2NHogTTQ0OCw0ODBIMTYwdi04MGgyNTZ2LTE2DQoJCUgxNjB2LTQ4aDI1NnYtMTZIMTYwdi00OGgyNTZ2LTE2SDE2MHYtNDhoMjU2di0xNkgxNjB2LTY0aDI4OFY0ODB6Ii8+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==',
    },
    creationTimestamp: '2022-03-10T04:09:58Z',
    generation: 1,
    managedFields: [
      {
        apiVersion: 'camel.apache.org/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            '.': {},
            'f:sink': {
              '.': {},
              'f:ref': { '.': {}, 'f:apiVersion': {}, 'f:kind': {}, 'f:name': {} },
            },
            'f:source': {
              '.': {},
              'f:ref': { '.': {}, 'f:apiVersion': {}, 'f:kind': {}, 'f:name': {} },
            },
          },
        },
        manager: 'Mozilla',
        operation: 'Update',
        time: '2022-03-10T04:09:58Z',
      },
      {
        apiVersion: 'camel.apache.org/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': { 'f:annotations': { '.': {}, 'f:camel.apache.org/kamelet.icon': {} } },
        },
        manager: 'kamel',
        operation: 'Update',
        time: '2022-03-10T04:09:58Z',
      },
      {
        apiVersion: 'camel.apache.org/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:status': {
            '.': {},
            'f:conditions': {},
            'f:phase': {},
            'f:replicas': {},
            'f:selector': {},
          },
        },
        manager: 'kamel',
        operation: 'Update',
        subresource: 'status',
        time: '2022-03-10T04:11:13Z',
      },
    ],
    name: 'log-sink-binding',
    namespace: 'jai-test',
    resourceVersion: '49188',
    uid: 'ef3daae8-3a43-45b1-be6c-4170983f26ab',
  },
  spec: {
    sink: { ref: { apiVersion: 'camel.apache.org/v1alpha1', kind: 'Kamelet', name: 'log-sink' } },
    source: { ref: { apiVersion: 'messaging.knative.dev/v1', kind: 'Channel', name: 'channel' } },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-03-10T04:11:13Z',
        lastUpdateTime: '2022-03-10T04:11:13Z',
        status: 'True',
        type: 'Ready',
      },
    ],
    phase: 'Ready',
    replicas: 1,
    selector: 'camel.apache.org/integration=log-sink-binding',
  },
};
