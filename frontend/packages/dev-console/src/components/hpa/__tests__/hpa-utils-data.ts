import {
  DeploymentKind,
  HorizontalPodAutoscalerKind,
  K8sResourceKind,
} from '@console/internal/module/k8s';

export const deploymentExamples: { [key: string]: DeploymentKind } = {
  hasNoLimits: {
    kind: 'Deployment',
    apiVersion: 'apps/v1',
    metadata: {
      name: 'nodejs-rest-http',
      namespace: 'test-ns',
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'nodejs-rest-http',
        },
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http',
            deploymentconfig: 'nodejs-rest-http',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http:latest',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File',
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
      progressDeadlineSeconds: 600,
    },
  },
  hasMemoryOnlyLimits: {
    kind: 'Deployment',
    apiVersion: 'apps/v1',
    metadata: {
      name: 'nodejs-rest-http-with-memory-limits',
      namespace: 'test-ns',
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'nodejs-rest-http-with-memory-limits',
        },
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http-with-memory-limits',
            deploymentconfig: 'nodejs-rest-http-with-memory-limits',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http-with-memory-limits',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-with-memory-limits:latest',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  memory: '2Mi',
                },
              },
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File',
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
      progressDeadlineSeconds: 600,
    },
  },
  hasCpuOnlyLimits: {
    kind: 'Deployment',
    apiVersion: 'apps/v1',
    metadata: {
      name: 'nodejs-rest-http-with-cpu-limits',
      namespace: 'test-ns',
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'nodejs-rest-http-with-cpu-limits',
        },
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http-with-cpu-limits',
            deploymentconfig: 'nodejs-rest-http-with-cpu-limits',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http-with-cpu-limits',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-with-cpu-limits:latest',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  cpu: '2m',
                },
              },
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File',
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
      progressDeadlineSeconds: 600,
    },
  },
  hasCpuAndMemoryLimits: {
    kind: 'Deployment',
    apiVersion: 'apps/v1',
    metadata: {
      name: 'nodejs-rest-http-with-resource-limits',
      namespace: 'test-ns',
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'nodejs-rest-http-with-resource-limits',
        },
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http-with-resource-limits',
            deploymentconfig: 'nodejs-rest-http-with-resource-limits',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http-with-resource-limits',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-with-resource-limits:latest',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  cpu: '2m',
                  memory: '2Mi',
                },
              },
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File',
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
      progressDeadlineSeconds: 600,
    },
  },
};

export const deploymentConfigExamples: { [key: string]: K8sResourceKind } = {
  hasNoLimits: {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: {
      name: 'nodejs-rest-http-crud',
      namespace: 'test-ns',
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
            containerNames: ['nodejs-rest-http-crud'],
            from: {
              kind: 'ImageStreamTag',
              namespace: 'andrew',
              name: 'nodejs-rest-http-crud:latest',
            },
            lastTriggeredImage:
              'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud@sha256:461b6963d26b1ca3a618bb51649a417d1de8411c5cb3f5a8998ec14584a0a5ba',
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
        app: 'nodejs-rest-http-crud',
        deploymentconfig: 'nodejs-rest-http-crud',
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http-crud',
            deploymentconfig: 'nodejs-rest-http-crud',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http-crud',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud@sha256:461b6963d26b1ca3a618bb51649a417d1de8411c5cb3f5a8998ec14584a0a5ba',
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
  },
  hasMemoryOnlyLimits: {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: {
      name: 'nodejs-rest-http-crud-memory-limits',
      namespace: 'test-ns',
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
            containerNames: ['nodejs-rest-http-crud-memory-limits'],
            from: {
              kind: 'ImageStreamTag',
              namespace: 'andrew',
              name: 'nodejs-rest-http-crud-memory-limits:latest',
            },
            lastTriggeredImage:
              'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud-memory-limits@sha256:7b2d8948044492b6c719fd7b64bbf51170293fabc93be8b027c075a500a06bc0',
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
        app: 'nodejs-rest-http-crud-memory-limits',
        deploymentconfig: 'nodejs-rest-http-crud-memory-limits',
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http-crud-memory-limits',
            deploymentconfig: 'nodejs-rest-http-crud-memory-limits',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http-crud-memory-limits',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud-memory-limits@sha256:7b2d8948044492b6c719fd7b64bbf51170293fabc93be8b027c075a500a06bc0',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  memory: '2Mi',
                },
                requests: {
                  memory: '1Mi',
                },
              },
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
  },
  hasCpuOnlyLimits: {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: {
      name: 'nodejs-rest-http-crud-cpu-limits',
      namespace: 'test-ns',
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
            containerNames: ['nodejs-rest-http-crud-cpu-limits'],
            from: {
              kind: 'ImageStreamTag',
              namespace: 'andrew',
              name: 'nodejs-rest-http-crud-cpu-limits:latest',
            },
            lastTriggeredImage:
              'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud-cpu-limits@sha256:7b2d8948044492b6c719fd7b64bbf51170293fabc93be8b027c075a500a06bc0',
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
        app: 'nodejs-rest-http-crud-cpu-limits',
        deploymentconfig: 'nodejs-rest-http-crud-cpu-limits',
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http-crud-cpu-limits',
            deploymentconfig: 'nodejs-rest-http-crud-cpu-limits',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http-crud-cpu-limits',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud-cpu-limits@sha256:7b2d8948044492b6c719fd7b64bbf51170293fabc93be8b027c075a500a06bc0',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  cpu: '2m',
                },
                requests: {
                  cpu: '1m',
                },
              },
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
  },
  hasCpuAndMemoryLimits: {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: {
      name: 'nodejs-rest-http-crud-resource-limits',
      namespace: 'test-ns',
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
            containerNames: ['nodejs-rest-http-crud-resource-limits'],
            from: {
              kind: 'ImageStreamTag',
              namespace: 'andrew',
              name: 'nodejs-rest-http-crud-resource-limits:latest',
            },
            lastTriggeredImage:
              'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud-resource-limits@sha256:7b2d8948044492b6c719fd7b64bbf51170293fabc93be8b027c075a500a06bc0',
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
        app: 'nodejs-rest-http-crud-resource-limits',
        deploymentconfig: 'nodejs-rest-http-crud-resource-limits',
      },
      template: {
        metadata: {
          creationTimestamp: null,
          labels: {
            app: 'nodejs-rest-http-crud-resource-limits',
            deploymentconfig: 'nodejs-rest-http-crud-resource-limits',
          },
        },
        spec: {
          containers: [
            {
              name: 'nodejs-rest-http-crud-resource-limits',
              image:
                'image-registry.openshift-image-registry.svc:5000/test-ns/nodejs-rest-http-crud-resource-limits@sha256:7b2d8948044492b6c719fd7b64bbf51170293fabc93be8b027c075a500a06bc0',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  cpu: '2m',
                  memory: '2Mi',
                },
                requests: {
                  cpu: '1m',
                  memory: '1Mi',
                },
              },
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
  },
};

export const hpaExamples: { [key: string]: HorizontalPodAutoscalerKind } = {
  noMetrics: {
    kind: 'HorizontalPodAutoscaler',
    apiVersion: 'autoscaling/v2beta2',
    metadata: {
      name: 'example',
      namespace: 'test-ns',
    },
    spec: {
      scaleTargetRef: {
        kind: 'Deployment',
        name: 'example',
        apiVersion: 'apps/v1',
      },
      minReplicas: 1,
      maxReplicas: 3,
    },
  },
  cpuScaled: {
    kind: 'HorizontalPodAutoscaler',
    apiVersion: 'autoscaling/v2beta2',
    metadata: {
      name: 'example',
      namespace: 'test-ns',
    },
    spec: {
      scaleTargetRef: {
        kind: 'Deployment',
        name: 'nodejs-rest-http-crud-resource-limits',
        apiVersion: 'apps/v1',
      },
      minReplicas: 2,
      maxReplicas: 10,
      metrics: [
        {
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: 42,
            },
          },
        },
      ],
    },
  },
};
