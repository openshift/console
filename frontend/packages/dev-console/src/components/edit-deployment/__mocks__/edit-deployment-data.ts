import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export const mockFormValues = {
  name: 'nationalparks-py-dc',
  project: {
    name: 'div',
  },
  resourceVersion: '119882',
  deploymentStrategy: {
    type: 'Rolling',
    resources: {},
    activeDeadlineSeconds: 21600,
    rollingParams: {
      timeoutSeconds: 600,
      pre: {
        lch: {
          failurePolicy: 'Abort',
          execNewPod: {
            command: [''],
            volumes: '',
          },
          tagImages: [],
        },
        exists: false,
        isAddingLch: false,
        action: 'execNewPod',
      },
      post: {
        lch: {
          failurePolicy: 'Abort',
          execNewPod: {
            command: [''],
            volumes: '',
          },
          tagImages: [],
        },
        exists: false,
        isAddingLch: false,
        action: 'execNewPod',
      },
      updatePeriodSeconds: 1,
      intervalSeconds: 1,
      maxSurge: '25%',
      maxUnavailable: '25%',
    },
    imageStreamData: {
      pre: {
        name: 'nationalparks-py-dc',
        project: {
          name: 'div',
        },
        fromImageStreamTag: true,
        imageStreamTag: {},
        containerName: '',
        to: {},
        isSearchingForImage: false,
        imageStream: {
          namespace: 'div',
          image: '',
          tag: '',
        },
        isi: {
          name: '',
          image: {},
          tag: '',
          status: {
            metadata: {},
            status: '',
          },
          ports: [],
        },
        image: {
          name: '',
          image: {},
          tag: '',
          status: {
            metadata: {},
            status: '',
          },
          ports: [],
        },
      },
      post: {
        name: 'nationalparks-py-dc',
        project: {
          name: 'div',
        },
        fromImageStreamTag: true,
        imageStreamTag: {},
        containerName: '',
        to: {},
        isSearchingForImage: false,
        imageStream: {
          namespace: 'div',
          image: '',
          tag: '',
        },
        isi: {
          name: '',
          image: {},
          tag: '',
          status: {
            metadata: {},
            status: '',
          },
          ports: [],
        },
        image: {
          name: '',
          image: {},
          tag: '',
          status: {
            metadata: {},
            status: '',
          },
          ports: [],
        },
      },
    },
  },
  containers: [
    {
      name: 'nationalparks-py-dc',
      image:
        'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py-dc@sha256:e187d5a42e4817792ef05b92871558eef47df5092d8c6256dc5d8369695117a0',
      ports: [
        {
          containerPort: 8080,
          protocol: 'TCP',
        },
      ],
      resources: {},
      terminationMessagePath: '/dev/termination-log',
      terminationMessagePolicy: 'File',
      imagePullPolicy: 'Always',
    },
  ],
  imageName:
    'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py-dc@sha256:e187d5a42e4817792ef05b92871558eef47df5092d8c6256dc5d8369695117a0',
  paused: false,
  replicas: 1,
  isSearchingForImage: false,
  imageStream: {
    image: 'nationalparks-py-dc',
    tag: 'latest',
    namespace: 'div',
  },
  isi: {
    name: 'nationalparks-py-dc',
    image: {},
    tag: '',
    status: {
      metadata: {},
      status: '',
    },
    ports: [],
  },
  image: {
    name: '',
    image: {},
    tag: '',
    status: {
      metadata: {},
      status: '',
    },
    ports: [],
  },
  triggers: {
    image: true,
    config: true,
  },
  fromImageStreamTag: true,
  envs: [],
};

export const mockEditDeploymentData = {
  editorType: EditorType.Form,
  yamlData: '',
  formData: mockFormValues,
};

export const mockDeploymentConfig = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps.openshift.io/v1',
  metadata: {
    annotations: {
      'app.openshift.io/vcs-ref': '',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
    resourceVersion: '119882',
    name: 'nationalparks-py-dc',
    uid: '6ceb4bda-38ec-4483-84e4-42a6c0559537',
    creationTimestamp: '2021-04-30T10:05:18Z',
    generation: 2,
    managedFields: [
      {
        manager: 'Mozilla',
        operation: 'Update',
        apiVersion: 'apps.openshift.io/v1',
        time: '2021-04-30T10:05:18Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:annotations': {
              '.': {},
              'f:app.openshift.io/vcs-ref': {},
              'f:app.openshift.io/vcs-uri': {},
              'f:openshift.io/generated-by': {},
            },
            'f:labels': {
              '.': {},
              'f:app': {},
              'f:app.kubernetes.io/component': {},
              'f:app.kubernetes.io/instance': {},
              'f:app.kubernetes.io/name': {},
              'f:app.kubernetes.io/part-of': {},
              'f:app.openshift.io/runtime': {},
              'f:app.openshift.io/runtime-version': {},
            },
          },
          'f:spec': {
            'f:replicas': {},
            'f:selector': {
              '.': {},
              'f:app': {},
              'f:deploymentconfig': {},
            },
            'f:strategy': {
              'f:activeDeadlineSeconds': {},
              'f:rollingParams': {
                '.': {},
                'f:intervalSeconds': {},
                'f:maxSurge': {},
                'f:maxUnavailable': {},
                'f:timeoutSeconds': {},
                'f:updatePeriodSeconds': {},
              },
              'f:type': {},
            },
            'f:template': {
              '.': {},
              'f:metadata': {
                '.': {},
                'f:creationTimestamp': {},
                'f:labels': {
                  '.': {},
                  'f:app': {},
                  'f:deploymentconfig': {},
                },
              },
              'f:spec': {
                '.': {},
                'f:containers': {
                  '.': {},
                  'k:{"name":"nationalparks-py-dc"}': {
                    '.': {},
                    'f:imagePullPolicy': {},
                    'f:name': {},
                    'f:ports': {
                      '.': {},
                      'k:{"containerPort":8080,"protocol":"TCP"}': {
                        '.': {},
                        'f:containerPort': {},
                        'f:protocol': {},
                      },
                    },
                    'f:resources': {},
                    'f:terminationMessagePath': {},
                    'f:terminationMessagePolicy': {},
                  },
                },
                'f:dnsPolicy': {},
                'f:restartPolicy': {},
                'f:schedulerName': {},
                'f:securityContext': {},
                'f:terminationGracePeriodSeconds': {},
              },
            },
          },
        },
      },
      {
        manager: 'openshift-controller-manager',
        operation: 'Update',
        apiVersion: 'apps.openshift.io/v1',
        time: '2021-04-30T10:06:55Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            'f:template': {
              'f:spec': {
                'f:containers': {
                  'k:{"name":"nationalparks-py-dc"}': {
                    'f:image': {},
                  },
                },
              },
            },
            'f:triggers': {},
          },
          'f:status': {
            'f:updatedReplicas': {},
            'f:readyReplicas': {},
            'f:conditions': {
              '.': {},
              'k:{"type":"Available"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:lastUpdateTime': {},
                'f:message': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"Progressing"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:lastUpdateTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
            },
            'f:details': {
              '.': {},
              'f:causes': {},
              'f:message': {},
            },
            'f:replicas': {},
            'f:availableReplicas': {},
            'f:observedGeneration': {},
            'f:unavailableReplicas': {},
            'f:latestVersion': {},
          },
        },
      },
    ],
    namespace: 'div',
    labels: {
      app: 'nationalparks-py-dc',
      'app.kubernetes.io/component': 'nationalparks-py-dc',
      'app.kubernetes.io/instance': 'nationalparks-py-dc',
      'app.kubernetes.io/name': 'nationalparks-py-dc',
      'app.kubernetes.io/part-of': 'nationalparks-py-app',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.8-ubi7',
    },
  },
  spec: {
    strategy: {
      type: 'Rolling',
      rollingParams: {
        updatePeriodSeconds: 1,
        intervalSeconds: 1,
        timeoutSeconds: 600,
        maxUnavailable: '25%',
        maxSurge: '25%',
      },
      resources: {},
      activeDeadlineSeconds: 21600,
    },
    triggers: [
      {
        type: 'ImageChange',
        imageChangeParams: {
          automatic: true,
          containerNames: ['nationalparks-py-dc'],
          from: {
            kind: 'ImageStreamTag',
            namespace: 'div',
            name: 'nationalparks-py-dc:latest',
          },
          lastTriggeredImage:
            'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py-dc@sha256:e187d5a42e4817792ef05b92871558eef47df5092d8c6256dc5d8369695117a0',
        },
      },
      {
        type: 'ConfigChange',
      },
    ],
    replicas: 1,
    revisionHistoryLimit: 10,
    test: false,
    selector: {
      app: 'nationalparks-py-dc',
      deploymentconfig: 'nationalparks-py-dc',
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          app: 'nationalparks-py-dc',
          deploymentconfig: 'nationalparks-py-dc',
        },
      },
      spec: {
        containers: [
          {
            name: 'nationalparks-py-dc',
            image:
              'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py-dc@sha256:e187d5a42e4817792ef05b92871558eef47df5092d8c6256dc5d8369695117a0',
            ports: [
              {
                containerPort: 8080,
                protocol: 'TCP',
              },
            ],
            resources: {},
            terminationMessagePath: '/dev/termination-log',
            terminationMessagePolicy: 'File',
            imagePullPolicy: 'Always',
          },
        ],
        restartPolicy: 'Always',
        terminationGracePeriodSeconds: 30,
        dnsPolicy: 'ClusterFirst',
        securityContext: {},
        schedulerName: 'default-scheduler',
      },
    },
  },
  status: {
    observedGeneration: 2,
    details: {
      message: 'config change',
      causes: [
        {
          type: 'ConfigChange',
        },
      ],
    },
    availableReplicas: 1,
    unavailableReplicas: 0,
    latestVersion: 1,
    updatedReplicas: 1,
    conditions: [
      {
        type: 'Available',
        status: 'True',
        lastUpdateTime: '2021-04-30T10:06:54Z',
        lastTransitionTime: '2021-04-30T10:06:54Z',
        message: 'Deployment config has minimum availability.',
      },
      {
        type: 'Progressing',
        status: 'True',
        lastUpdateTime: '2021-04-30T10:06:55Z',
        lastTransitionTime: '2021-04-30T10:06:55Z',
        reason: 'NewReplicationControllerAvailable',
        message: 'replication controller "nationalparks-py-dc-1" successfully rolled out',
      },
    ],
    replicas: 1,
    readyReplicas: 1,
  },
};

export const mockDeployment = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: {
      'app.openshift.io/connects-to': '["wit"]',
    },
    resourceVersion: '753748',
    name: 'analytics-deployment',
    uid: '5ca9ae28-680d-11e9-8c69-5254003f9382',
    creationTimestamp: '2019-04-22T11:35:37Z',
    generation: 5,
    namespace: 'testproject1',
    labels: {
      'app.kubernetes.io/component': 'backend',
      'app.kubernetes.io/instance': 'analytics',
      'app.kubernetes.io/name': 'python',
      'app.kubernetes.io/part-of': 'application-1',
      'app.kubernetes.io/version': '1.0',
    },
  },
  spec: {
    replicas: 3,
    selector: {
      matchLabels: {
        'app.kubernetes.io/component': 'backend',
        'app.kubernetes.io/instance': 'analytics',
        'app.kubernetes.io/name': 'python',
        'app.kubernetes.io/part-of': 'application-1',
        'app.kubernetes.io/version': '1.0',
      },
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      spec: {
        containers: [],
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
    progressDeadlineSeconds: 600,
  },
  status: {},
};
