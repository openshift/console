export const knSinkDeployment = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: {
      'deployment.kubernetes.io/revision': '1',
    },
    resourceVersion: '991824',
    name: 'log-sink-binding-uri',
    uid: '88c41236-f5b1-49b5-90be-e026a52d6170',
    creationTimestamp: '2022-03-24T06:34:49Z',
    generation: 1,
    namespace: 'sample-app',
    ownerReferences: [
      {
        apiVersion: 'camel.apache.org/v1',
        kind: 'Integration',
        name: 'log-sink-binding-uri',
        uid: 'ba1e9715-3b3e-4602-8065-8659968e5e5e',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
    labels: {
      'camel.apache.org/generation': '1',
      'camel.apache.org/integration': 'log-sink-binding-uri',
    },
  },
  status: {
    observedGeneration: 1,
    replicas: 1,
    updatedReplicas: 1,
    unavailableReplicas: 1,
    conditions: [
      {
        type: 'Progressing',
        status: 'True',
        lastUpdateTime: '2022-03-24T06:35:35Z',
        lastTransitionTime: '2022-03-24T06:34:49Z',
        reason: 'NewReplicaSetAvailable',
        message: 'ReplicaSet log-sink-binding-uri-6d54994b8b has successfully progressed.',
      },
      {
        type: 'Available',
        status: 'False',
        lastUpdateTime: '2022-03-24T12:41:00Z',
        lastTransitionTime: '2022-03-24T12:41:00Z',
        reason: 'MinimumReplicasUnavailable',
        message: 'Deployment does not have minimum availability.',
      },
    ],
  },
};

export const knSourceDeployment = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: {
      'deployment.kubernetes.io/revision': '1',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
    resourceVersion: '1243883',
    name: 'kamelet-telegram-source',
    uid: 'c253be20-78a3-4c41-931e-0169bccb02c0',
    creationTimestamp: '2022-03-24T14:37:45Z',
    generation: 1,
    namespace: 'sample-app',
    ownerReferences: [
      {
        apiVersion: 'camel.apache.org/v1',
        kind: 'Integration',
        name: 'kamelet-telegram-source',
        uid: 'e8af5fe3-2c95-4693-a499-e00bffaab420',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
    labels: {
      'camel.apache.org/generation': '1',
      'camel.apache.org/integration': 'kamelet-telegram-source',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        'camel.apache.org/integration': 'kamelet-telegram-source',
      },
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          'camel.apache.org/integration': 'kamelet-telegram-source',
        },
        annotations: {
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        volumes: [
          {
            name: 'i-source-000',
            configMap: {
              name: 'kamelet-telegram-source-source-000',
              items: [
                {
                  key: 'content',
                  path: 'camel-k-embedded-flow.yaml',
                },
              ],
              defaultMode: 420,
            },
          },
          {
            name: 'i-source-001',
            configMap: {
              name: 'kamelet-telegram-source-kamelet-telegram-source-template',
              items: [
                {
                  key: 'content',
                  path: 'telegram-source.yaml',
                },
              ],
              defaultMode: 420,
            },
          },
          {
            name: 'user-properties',
            configMap: {
              name: 'kamelet-telegram-source-user-properties',
              items: [
                {
                  key: 'application.properties',
                  path: 'user.properties',
                },
              ],
              defaultMode: 420,
            },
          },
          {
            name: 'application-properties',
            configMap: {
              name: 'kamelet-telegram-source-application-properties',
              items: [
                {
                  key: 'application.properties',
                  path: 'application.properties',
                },
              ],
              defaultMode: 420,
            },
          },
        ],
        containers: [
          {
            resources: {},
            terminationMessagePath: '/dev/termination-log',
            name: 'integration',
            command: ['/bin/sh', '-c'],
            env: [
              {
                name: 'CAMEL_K_DIGEST',
                value: 'v1U9Mc8CpnHW4PPoKpjWjUfAP9eYzwBUrWKXMmfhvE1Q',
              },
              {
                name: 'CAMEL_K_CONF',
                value: '/etc/camel/application.properties',
              },
              {
                name: 'CAMEL_K_CONF_D',
                value: '/etc/camel/conf.d',
              },
              {
                name: 'CAMEL_KNATIVE_CONFIGURATION',
                value:
                  '{"services":[{"type":"endpoint","name":"sink","url":"https://svc.com","metadata":{"camel.endpoint.kind":"sink","knative.apiVersion":"","knative.kind":""}}]}',
              },
              {
                name: 'CAMEL_K_VERSION',
                value: '1.8.2',
              },
              {
                name: 'CAMEL_K_INTEGRATION',
                value: 'kamelet-telegram-source',
              },
              {
                name: 'CAMEL_K_RUNTIME_VERSION',
                value: '1.12.0',
              },
              {
                name: 'CAMEL_K_MOUNT_PATH_CONFIGMAPS',
                value: '/etc/camel/conf.d/_configmaps',
              },
              {
                name: 'CAMEL_K_MOUNT_PATH_SECRETS',
                value: '/etc/camel/conf.d/_secrets',
              },
              {
                name: 'NAMESPACE',
                valueFrom: {
                  fieldRef: {
                    apiVersion: 'v1',
                    fieldPath: 'metadata.namespace',
                  },
                },
              },
              {
                name: 'POD_NAME',
                valueFrom: {
                  fieldRef: {
                    apiVersion: 'v1',
                    fieldPath: 'metadata.name',
                  },
                },
              },
              {
                name: 'QUARKUS_LOG_LEVEL',
                value: 'INFO',
              },
              {
                name: 'QUARKUS_LOG_CONSOLE_JSON',
                value: 'false',
              },
              {
                name: 'QUARKUS_LOG_CONSOLE_COLOR',
                value: 'true',
              },
            ],
            imagePullPolicy: 'IfNotPresent',
            volumeMounts: [
              {
                name: 'i-source-000',
                readOnly: true,
                mountPath: '/etc/camel/sources/camel-k-embedded-flow.yaml',
                subPath: 'camel-k-embedded-flow.yaml',
              },
              {
                name: 'i-source-001',
                readOnly: true,
                mountPath: '/etc/camel/sources/telegram-source.yaml',
                subPath: 'telegram-source.yaml',
              },
              {
                name: 'user-properties',
                readOnly: true,
                mountPath: '/etc/camel/conf.d/user.properties',
                subPath: 'user.properties',
              },
              {
                name: 'application-properties',
                readOnly: true,
                mountPath: '/etc/camel/application.properties',
                subPath: 'application.properties',
              },
            ],
            terminationMessagePolicy: 'File',
            image:
              'image-registry.openshift-image-registry.svc:5000/openshift-operators/camel-k-kit-c8u840tf899u5ia6mn60@sha256:3991e2787f238e0f790607bf37b7d71d6047fe595b2397a225a67f5c012e3214',
            workingDir: '/deployments',
          },
        ],
        restartPolicy: 'Always',
        terminationGracePeriodSeconds: 30,
        dnsPolicy: 'ClusterFirst',
        securityContext: {},
        schedulerName: 'default-scheduler',
      },
    },
    strategy: {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxUnavailable: '25%',
        maxSurge: '25%',
      },
    },
    revisionHistoryLimit: 10,
    progressDeadlineSeconds: 60,
  },
  status: {
    observedGeneration: 1,
    replicas: 1,
    updatedReplicas: 1,
    readyReplicas: 1,
    availableReplicas: 1,
    conditions: [
      {
        type: 'Available',
        status: 'True',
        lastUpdateTime: '2022-03-24T14:37:49Z',
        lastTransitionTime: '2022-03-24T14:37:49Z',
        reason: 'MinimumReplicasAvailable',
        message: 'Deployment has minimum availability.',
      },
      {
        type: 'Progressing',
        status: 'True',
        lastUpdateTime: '2022-03-24T14:37:49Z',
        lastTransitionTime: '2022-03-24T14:37:45Z',
        reason: 'NewReplicaSetAvailable',
        message: 'ReplicaSet "kamelet-telegram-source-754bbcc5cc" has successfully progressed.',
      },
    ],
  },
};

export const kameletBindingSinkRes = {
  kind: 'KameletBinding',
  apiVersion: 'camel.apache.org/v1alpha1',
  metadata: {
    annotations: {
      'camel.apache.org/kamelet.icon':
        'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE2LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTQ0OCwwSDY0QzQ2LjMyOCwwLDMyLDE0LjMxMywzMiwzMnY0NDhjMCwxNy42ODgsMTQuMzI4LDMyLDMyLDMyaDM4NGMxNy42ODgsMCwzMi0xNC4zMTIsMzItMzJWMzINCgkJQzQ4MCwxNC4zMTMsNDY1LjY4OCwwLDQ0OCwweiBNNjQsNDgwVjEyOGg4MHY2NEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY0OEg5NnYxNmg0OHY4MEg2NHogTTQ0OCw0ODBIMTYwdi04MGgyNTZ2LTE2DQoJCUgxNjB2LTQ4aDI1NnYtMTZIMTYwdi00OGgyNTZ2LTE2SDE2MHYtNDhoMjU2di0xNkgxNjB2LTY0aDI4OFY0ODB6Ii8+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==',
    },
    creationTimestamp: '2022-03-24T06:34:49Z',
    generation: 1,
    name: 'log-sink-binding-uri',
    namespace: 'sample-app',
    resourceVersion: '158345',
    uid: '60d191b6-4813-47d6-a52e-e67ea7a899e4',
  },
  spec: {
    sink: {
      ref: { apiVersion: 'camel.apache.org/v1alpha1', kind: 'Kamelet', name: 'log-sink' },
    },
    source: { uri: 'http://abc.com' },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-03-24T06:35:36Z',
        lastUpdateTime: '2022-03-24T06:35:36Z',
        reason: 'Error',
        status: 'False',
        type: 'Ready',
      },
    ],
    phase: 'Error',
    replicas: 1,
    selector: 'camel.apache.org/integration=log-sink-binding-uri',
  },
};

export const modelsKnTopology = {
  nodes: [
    {
      group: false,
      height: 104,
      id: '60d191b6-4813-47d6-a52e-e67ea7a899e4',
      label: 'log-sink-binding-uri',
      resourceKind: 'camel.apache.org~v1alpha1~KameletBinding',
      type: 'event-sink',
      visible: true,
      width: 104,
      resource: kameletBindingSinkRes,
      resources: {
        deployments: {
          loaded: true,
          loadError: '',
          data: [knSinkDeployment],
        },
        integrations: {
          data: [
            {
              kind: 'Integration',
              apiVersion: 'camel.apache.org/v1',
              metadata: {
                resourceVersion: '728920',
                name: 'log-sink-binding-uri',
                uid: 'ba1e9715-3b3e-4602-8065-8659968e5e5e',
                creationTimestamp: '2022-03-25T10:43:55Z',
                generation: 1,
                namespace: 'sample-app',
                ownerReferences: [
                  {
                    apiVersion: 'camel.apache.org/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'KameletBinding',
                    name: 'log-sink-binding-uri',
                    uid: '60d191b6-4813-47d6-a52e-e67ea7a899e4',
                  },
                ],
                labels: {
                  'camel.apache.org/created.by.kind': 'KameletBinding',
                  'camel.apache.org/created.by.name': 'log-sink-binding-uri',
                },
              },
              spec: {
                flows: [
                  {
                    route: {
                      from: {
                        uri: 'http://abc.com',
                      },
                      id: 'binding',
                      steps: [
                        {
                          to: 'kamelet:log-sink/sink',
                        },
                      ],
                    },
                  },
                ],
                profile: 'Knative',
              },
              status: {
                runtimeVersion: '1.12.0',
                integrationKit: {
                  name: 'kit-c8uppthuvq78uiupiqlg',
                  namespace: 'openshift-operators',
                },
                digest: 'vtASpKFoK5Li7-QDvA5W4tooPdOGcoEu7oAt8AbxIUhU',
                dependencies: [
                  'camel:http',
                  'camel:kamelet',
                  'camel:log',
                  'mvn:org.apache.camel.k:camel-k-runtime',
                  'mvn:org.apache.camel.quarkus:camel-quarkus-yaml-dsl',
                ],
                profile: 'Knative',
                runtimeProvider: 'quarkus',
                generatedSources: [
                  {
                    content:
                      '- route:\n    from:\n      uri: http://abc.com\n    id: binding\n    steps:\n    - to: kamelet:log-sink/sink\n',
                    name: 'camel-k-embedded-flow.yaml',
                  },
                  {
                    contentKey: 'content',
                    contentRef: 'log-sink-binding-uri-kamelet-log-sink-template',
                    language: 'yaml',
                    name: 'log-sink.yaml',
                  },
                ],
                lastInitTimestamp: '2022-03-25T10:44:06Z',
                platform: 'camel-k',
                version: '1.8.2',
                conditions: [
                  {
                    firstTruthyTime: '2022-03-25T10:44:06Z',
                    lastTransitionTime: '2022-03-25T10:44:06Z',
                    lastUpdateTime: '2022-03-25T10:44:06Z',
                    message: 'openshift-operators/camel-k',
                    reason: 'IntegrationPlatformAvailable',
                    status: 'True',
                    type: 'IntegrationPlatformAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T10:44:06Z',
                    lastTransitionTime: '2022-03-25T10:44:06Z',
                    lastUpdateTime: '2022-03-25T10:44:06Z',
                    message:
                      'kamelets log-sink found in repositories: (Kubernetes[namespace=sample-app], Kubernetes[namespace=openshift-operators], Empty[])',
                    reason: 'KameletsAvailable',
                    status: 'True',
                    type: 'KameletsAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T10:45:11Z',
                    lastTransitionTime: '2022-03-25T10:45:11Z',
                    lastUpdateTime: '2022-03-25T10:45:11Z',
                    message: 'kit-c8uppthuvq78uiupiqlg',
                    reason: 'IntegrationKitAvailable',
                    status: 'True',
                    type: 'IntegrationKitAvailable',
                  },
                  {
                    lastTransitionTime: '2022-03-25T10:45:11Z',
                    lastUpdateTime: '2022-03-25T10:45:11Z',
                    message: 'different controller strategy used (deployment)',
                    reason: 'CronJobNotAvailableReason',
                    status: 'False',
                    type: 'CronJobAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T10:45:11Z',
                    lastTransitionTime: '2022-03-25T10:45:11Z',
                    lastUpdateTime: '2022-03-25T10:45:11Z',
                    message: 'deployment name is log-sink-binding-uri',
                    reason: 'DeploymentAvailable',
                    status: 'True',
                    type: 'DeploymentAvailable',
                  },
                  {
                    lastTransitionTime: '2022-03-25T10:45:11Z',
                    lastUpdateTime: '2022-03-25T10:45:11Z',
                    message: 'different controller strategy used (deployment)',
                    reason: 'KnativeServiceNotAvailable',
                    status: 'False',
                    type: 'KnativeServiceAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T10:45:22Z',
                    lastTransitionTime: '2022-03-25T11:01:38Z',
                    lastUpdateTime: '2022-03-25T11:01:52Z',
                    message:
                      'back-off 5m0s restarting failed container=integration pod=log-sink-binding-uri-5ff4457955-2lqfk_sample-app(925645d3-f6fb-4e55-a252-d2c55afb10c1)',
                    reason: 'Error',
                    status: 'False',
                    type: 'Ready',
                  },
                ],
                image:
                  'image-registry.openshift-image-registry.svc:5000/openshift-operators/camel-k-kit-c8uppthuvq78uiupiqlg@sha256:b7c297ef390162d0c7991f43d63090a21f98641e7a59564a2f4ab85da54c9f1a',
                phase: 'Error',
                replicas: 1,
                selector: 'camel.apache.org/integration=log-sink-binding-uri',
              },
            },
          ],
          loaded: true,
          loadError: '',
        },
      },
    },
    {
      id: 'ea6ca73b-1a73-4048-b4a1-f12e094af814',
      type: 'event-source',
      label: 'kamelet-telegram-source',
      resource: {
        kind: 'KameletBinding',
        apiVersion: 'camel.apache.org/v1alpha1',
        metadata: {
          annotations: {
            'camel.apache.org/kamelet.icon':
              'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgMjQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIuNjY3IiB4Mj0iLjQxNyIgeTE9Ii4xNjciIHkyPSIuNzUiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzM3YWVlMiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFlOTZjOCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iLjY2IiB4Mj0iLjg1MSIgeTE9Ii40MzciIHkyPSIuODAyIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNlZmY3ZmMiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIxMjAiIGN5PSIxMjAiIHI9IjEyMCIgZmlsbD0idXJsKCNhKSIvPjxwYXRoIGZpbGw9IiNjOGRhZWEiIGQ9Ik05OCAxNzVjLTMuODg4IDAtMy4yMjctMS40NjgtNC41NjgtNS4xN0w4MiAxMzIuMjA3IDE3MCA4MCIvPjxwYXRoIGZpbGw9IiNhOWM5ZGQiIGQ9Ik05OCAxNzVjMyAwIDQuMzI1LTEuMzcyIDYtM2wxNi0xNS41NTgtMTkuOTU4LTEyLjAzNSIvPjxwYXRoIGZpbGw9InVybCgjYikiIGQ9Ik0xMDAuMDQgMTQ0LjQxbDQ4LjM2IDM1LjcyOWM1LjUxOSAzLjA0NSA5LjUwMSAxLjQ2OCAxMC44NzYtNS4xMjNsMTkuNjg1LTkyLjc2M2MyLjAxNS04LjA4LTMuMDgtMTEuNzQ2LTguMzYtOS4zNDlsLTExNS41OSA0NC41NzFjLTcuODkgMy4xNjUtNy44NDMgNy41NjctMS40MzggOS41MjhsMjkuNjYzIDkuMjU5IDY4LjY3My00My4zMjVjMy4yNDItMS45NjYgNi4yMTgtLjkxIDMuNzc2IDEuMjU4Ii8+PC9zdmc+',
            'openshift.io/generated-by': 'OpenShiftWebConsole',
          },
          resourceVersion: '1243754',
          name: 'kamelet-telegram-source',
          uid: 'ea6ca73b-1a73-4048-b4a1-f12e094af814',
          creationTimestamp: '2022-03-24T14:36:41Z',
          generation: 1,
          namespace: 'sample-app',
          labels: {
            app: 'kamelet-telegram-source',
            'app.kubernetes.io/component': 'kamelet-telegram-source',
            'app.kubernetes.io/instance': 'kamelet-telegram-source',
            'app.kubernetes.io/name': 'kamelet-telegram-source',
          },
        },
        spec: {
          sink: {
            uri: 'https://svc.com',
          },
          source: {
            properties: {
              authorizationToken: '123',
            },
            ref: {
              apiVersion: 'camel.apache.org/v1alpha1',
              kind: 'Kamelet',
              name: 'telegram-source',
            },
          },
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2022-03-24T14:37:45Z',
              lastUpdateTime: '2022-03-24T14:37:45Z',
              status: 'True',
              type: 'Ready',
            },
          ],
          phase: 'Ready',
          replicas: 1,
          selector: 'camel.apache.org/integration=kamelet-telegram-source',
        },
      },
      resourceKind: 'camel.apache.org~v1alpha1~KameletBinding',
      width: 104,
      height: 104,
      visible: true,
      resources: {
        deployments: {
          loaded: true,
          loadError: '',
          data: [knSourceDeployment],
        },
        integrations: {
          data: [
            {
              kind: 'Integration',
              apiVersion: 'camel.apache.org/v1',
              metadata: {
                annotations: {
                  'openshift.io/generated-by': 'OpenShiftWebConsole',
                },
                resourceVersion: '781170',
                name: 'kamelet-telegram-source',
                uid: 'e8af5fe3-2c95-4693-a499-e00bffaab420',
                creationTimestamp: '2022-03-25T11:18:00Z',
                generation: 1,
                namespace: 'sample-app',
                ownerReferences: [
                  {
                    apiVersion: 'camel.apache.org/v1alpha1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'KameletBinding',
                    name: 'kamelet-telegram-source',
                    uid: 'ea6ca73b-1a73-4048-b4a1-f12e094af814',
                  },
                ],
                labels: {
                  app: 'kamelet-telegram-source',
                  'app.kubernetes.io/component': 'kamelet-telegram-source',
                  'app.kubernetes.io/instance': 'kamelet-telegram-source',
                  'app.kubernetes.io/name': 'kamelet-telegram-source',
                  'camel.apache.org/created.by.kind': 'KameletBinding',
                  'camel.apache.org/created.by.name': 'kamelet-telegram-source',
                },
              },
              spec: {
                configuration: [
                  {
                    type: 'property',
                    value: 'camel.kamelet.telegram-source.source.authorizationToken = 123',
                  },
                ],
                flows: [
                  {
                    route: {
                      from: {
                        uri: 'kamelet:telegram-source/source',
                      },
                      id: 'binding',
                      steps: [
                        {
                          to: 'knative:endpoint/sink',
                        },
                      ],
                    },
                  },
                ],
                profile: 'Knative',
                traits: {
                  knative: {
                    configuration: {
                      configuration:
                        '{"services":[{"type":"endpoint","name":"sink","url":"https://svc.com","metadata":{"camel.endpoint.kind":"sink","knative.apiVersion":"","knative.kind":""}}]}',
                      sinkBinding: false,
                    },
                  },
                },
              },
              status: {
                runtimeVersion: '1.12.0',
                integrationKit: {
                  name: 'kit-c8uq9q1uvq78uiupiqm0',
                  namespace: 'openshift-operators',
                },
                digest: 'v1U9Mc8CpnHW4PPoKpjWjUfAP9eYzwBUrWKXMmfhvE1Q',
                dependencies: [
                  'camel:core',
                  'camel:jackson',
                  'camel:kamelet',
                  'camel:telegram',
                  'mvn:org.apache.camel.k:camel-k-knative',
                  'mvn:org.apache.camel.k:camel-k-knative-producer',
                  'mvn:org.apache.camel.k:camel-k-runtime',
                  'mvn:org.apache.camel.quarkus:camel-quarkus-platform-http',
                  'mvn:org.apache.camel.quarkus:camel-quarkus-yaml-dsl',
                ],
                profile: 'Knative',
                runtimeProvider: 'quarkus',
                generatedSources: [
                  {
                    content:
                      '- route:\n    from:\n      uri: kamelet:telegram-source/source\n    id: binding\n    steps:\n    - to: knative:endpoint/sink\n',
                    name: 'camel-k-embedded-flow.yaml',
                  },
                  {
                    contentKey: 'content',
                    contentRef: 'kamelet-telegram-source-kamelet-telegram-source-template',
                    language: 'yaml',
                    name: 'telegram-source.yaml',
                  },
                ],
                lastInitTimestamp: '2022-03-25T11:18:00Z',
                platform: 'camel-k',
                capabilities: ['platform-http'],
                version: '1.8.2',
                conditions: [
                  {
                    firstTruthyTime: '2022-03-25T11:18:00Z',
                    lastTransitionTime: '2022-03-25T11:18:00Z',
                    lastUpdateTime: '2022-03-25T11:18:00Z',
                    message: 'openshift-operators/camel-k',
                    reason: 'IntegrationPlatformAvailable',
                    status: 'True',
                    type: 'IntegrationPlatformAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T11:18:00Z',
                    lastTransitionTime: '2022-03-25T11:18:00Z',
                    lastUpdateTime: '2022-03-25T11:18:00Z',
                    message:
                      'kamelets telegram-source found in repositories: (Kubernetes[namespace=sample-app], Kubernetes[namespace=openshift-operators], Empty[])',
                    reason: 'KameletsAvailable',
                    status: 'True',
                    type: 'KameletsAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T11:18:39Z',
                    lastTransitionTime: '2022-03-25T11:18:39Z',
                    lastUpdateTime: '2022-03-25T11:18:39Z',
                    message: 'kit-c8uq9q1uvq78uiupiqm0',
                    reason: 'IntegrationKitAvailable',
                    status: 'True',
                    type: 'IntegrationKitAvailable',
                  },
                  {
                    lastTransitionTime: '2022-03-25T11:18:39Z',
                    lastUpdateTime: '2022-03-25T11:18:39Z',
                    message: 'different controller strategy used (deployment)',
                    reason: 'CronJobNotAvailableReason',
                    status: 'False',
                    type: 'CronJobAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T11:18:39Z',
                    lastTransitionTime: '2022-03-25T11:18:39Z',
                    lastUpdateTime: '2022-03-25T11:18:39Z',
                    message: 'deployment name is kamelet-telegram-source',
                    reason: 'DeploymentAvailable',
                    status: 'True',
                    type: 'DeploymentAvailable',
                  },
                  {
                    lastTransitionTime: '2022-03-25T11:18:39Z',
                    lastUpdateTime: '2022-03-25T11:18:39Z',
                    message: 'different controller strategy used (deployment)',
                    reason: 'KnativeServiceNotAvailable',
                    status: 'False',
                    type: 'KnativeServiceAvailable',
                  },
                  {
                    firstTruthyTime: '2022-03-25T11:18:43Z',
                    lastTransitionTime: '2022-03-25T11:18:43Z',
                    lastUpdateTime: '2022-03-25T11:18:43Z',
                    message: '1/1 ready replicas',
                    reason: 'DeploymentReady',
                    status: 'True',
                    type: 'Ready',
                  },
                ],
                image:
                  'image-registry.openshift-image-registry.svc:5000/openshift-operators/camel-k-kit-c8uq9q1uvq78uiupiqm0@sha256:70fd0bcd358bbac3866543b74687d5eaf25908812277daadf9d0aef8d860cd6b',
                phase: 'Running',
                replicas: 1,
                selector: 'camel.apache.org/integration=kamelet-telegram-source',
              },
            },
          ],
          loaded: true,
          loadError: '',
        },
      },
    },
  ],
  edges: [],
};
