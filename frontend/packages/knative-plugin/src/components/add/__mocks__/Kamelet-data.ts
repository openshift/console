export const mockKameletSink = {
  apiVersion: 'camel.apache.org/v1alpha1',
  kind: 'Kamelet',
  metadata: {
    annotations: {
      'camel.apache.org/catalog.version': '0.7.1',
      'camel.apache.org/kamelet.group': 'Logging',
      'camel.apache.org/kamelet.icon':
        'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE2LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTQ0OCwwSDY0QzQ2LjMyOCwwLDMyLDE0LjMxMywzMiwzMnY0NDhjMCwxNy42ODgsMTQuMzI4LDMyLDMyLDMyaDM4NGMxNy42ODgsMCwzMi0xNC4zMTIsMzItMzJWMzINCgkJQzQ4MCwxNC4zMTMsNDY1LjY4OCwwLDQ0OCwweiBNNjQsNDgwVjEyOGg4MHY2NEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY4MEg2NHogTTQ0OCw0ODBIMTYwdi04MGgyNTZ2LTE2DQoJCUgxNjB2LTQ4aDI1NnYtMTZIMTYwdi00OGgyNTZ2LTE2SDE2MHYtNDhoMjU2di0xNkgxNjB2LTY0aDI4OFY0ODB6Ii8+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==',
      'camel.apache.org/kamelet.support.level': 'Preview',
      'camel.apache.org/provider': 'Apache Software Foundation',
    },
    creationTimestamp: '2022-03-08T03:59:28Z',
    generation: 1,
    labels: { 'camel.apache.org/kamelet.type': 'sink' },
    managedFields: [
      {
        apiVersion: 'camel.apache.org/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:annotations': {
              'f:camel.apache.org/catalog.version': {},
              'f:camel.apache.org/kamelet.group': {},
              'f:camel.apache.org/kamelet.icon': {},
              'f:camel.apache.org/kamelet.support.level': {},
              'f:camel.apache.org/provider': {},
            },
            'f:labels': { 'f:camel.apache.org/kamelet.type': {} },
          },
          'f:spec': {
            'f:definition': {
              'f:description': {},
              'f:properties': {
                'f:showHeaders': {
                  '.': {},
                  'f:default': {},
                  'f:description': {},
                  'f:title': {},
                  'f:type': {},
                  'f:x-descriptors': {},
                },
                'f:showStreams': {
                  '.': {},
                  'f:default': {},
                  'f:description': {},
                  'f:title': {},
                  'f:type': {},
                  'f:x-descriptors': {},
                },
              },
              'f:title': {},
              'f:type': {},
            },
            'f:dependencies': {},
            'f:template': { 'f:from': { '.': {}, 'f:steps': {}, 'f:uri': {} } },
          },
        },
        manager: 'camel-k-operator',
        operation: 'Apply',
        time: '2022-03-08T03:59:28Z',
      },
      {
        apiVersion: 'camel.apache.org/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:status': { '.': {}, 'f:conditions': {}, 'f:phase': {}, 'f:properties': {} },
        },
        manager: 'kamel',
        operation: 'Update',
        subresource: 'status',
        time: '2022-03-08T03:59:30Z',
      },
    ],
    name: 'log-sink',
    namespace: 'openshift-operators',
    resourceVersion: '88246',
    uid: '619d0f01-941f-44f1-a82d-b00adfbdae3f',
  },
  spec: {
    definition: {
      description: 'A sink that logs all data that it receives, useful for debugging purposes.',
      properties: {
        showHeaders: {
          default: false,
          description: 'Show the headers received',
          title: 'Show Headers',
          type: 'boolean',
          'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:checkbox'],
        },
        showStreams: {
          default: false,
          description: 'Show the stream bodies (they may not be available in following steps)',
          title: 'Show Streams',
          type: 'boolean',
          'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:checkbox'],
        },
      },
      title: 'Log Sink',
      type: 'object',
    },
    dependencies: ['camel:kamelet', 'camel:log'],
    template: {
      from: {
        steps: [
          {
            to: {
              parameters: { showHeaders: '{{?showHeaders}}', showStreams: '{{?showStreams}}' },
              uri: 'log:info',
            },
          },
        ],
        uri: 'kamelet:source',
      },
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-03-08T03:59:30Z',
        lastUpdateTime: '2022-03-08T03:59:30Z',
        status: 'True',
        type: 'Ready',
      },
    ],
    phase: 'Ready',
    properties: [
      { default: 'false', name: 'showHeaders' },
      { default: 'false', name: 'showStreams' },
    ],
  },
};

export const mockNormalizedSink = {
  name: 'Log Sink',
  iconUrl: 'data:image/svg+xml;base64',
  provider: 'Apache Software Foundation',
};
