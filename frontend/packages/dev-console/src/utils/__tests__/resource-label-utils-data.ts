export const originalDeployment = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: {
      'alpha.image.policy.openshift.io/resolve-names': '*',
      'app.openshift.io/vcs-ref': 'master',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'image.openshift.io/triggers':
        '[{"from":{"kind":"ImageStreamTag","name":"nationalparks-py:latest","namespace":"div"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"nationalparks-py\\")].image","pause":"false"}]',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
      'app.openshift.io/connects-to': 'database',
      'deployment.kubernetes.io/revision': '4',
    },
    name: 'nationalparks-py',
    namespace: 'div',
    labels: {
      app: 'nationalparks-py',
      'app.kubernetes.io/component': 'nationalparks-py',
      'app.kubernetes.io/instance': 'nationalparks-py',
      'app.kubernetes.io/name': 'python',
      'app.kubernetes.io/part-of': 'nationalparks-py-app',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.8-ubi7',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: 'nationalparks-py',
      },
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          app: 'nationalparks-py',
          deploymentconfig: 'nationalparks-py',
        },
      },
      spec: {
        volumes: [
          {
            name: 'test-volume',
            emptyDir: {},
          },
        ],
        containers: [
          {
            name: 'nationalparks-py',
            image:
              'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:8b187a8f235f42e7ea3e21e740c4940fdfa3ec8b59a14bb1cd9a67ffedf2eef9',
            ports: [
              {
                containerPort: 8080,
                protocol: 'TCP',
              },
            ],
            envFrom: [
              {
                configMapRef: {
                  name: 'testconfig',
                },
              },
            ],
            volumeMounts: [
              {
                name: 'test-volume',
                mountPath: '/test',
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
};

export const newDeployment = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: {
      'alpha.image.policy.openshift.io/resolve-names': '*',
      'app.openshift.io/vcs-ref': 'master',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'image.openshift.io/triggers':
        '[{"from":{"kind":"ImageStreamTag","name":"nationalparks-py:latest","namespace":"div"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"nationalparks-py\\")].image","pause":"true"}]',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
    name: 'nationalparks-py',
    namespace: 'div',
    labels: {
      app: 'nationalparks-py',
      'app.kubernetes.io/component': 'nationalparks-py',
      'app.kubernetes.io/instance': 'nationalparks-py',
      'app.kubernetes.io/name': 'python',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.8-ubi7',
      'test-app': 'nationalparks-py',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: 'nationalparks-py',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'nationalparks-py',
          deploymentconfig: 'nationalparks-py',
          'test-app': 'nationalparks-py',
        },
      },
      spec: {
        containers: [
          {
            name: 'nationalparks-py',
            image:
              'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:8b187a8f235f42e7ea3e21e740c4940fdfa3ec8b59a14bb1cd9a67ffedf2eef9',
            ports: [
              {
                containerPort: 8080,
                protocol: 'TCP',
              },
            ],
            env: [
              {
                name: 'dev',
                value: 'test',
              },
            ],
            resources: {},
          },
        ],
      },
    },
  },
};

export const devfileDeployment = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: {
      'alpha.image.policy.openshift.io/resolve-names': '*',
      'app.openshift.io/vcs-ref': 'master',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'image.openshift.io/triggers':
        '[{"from":{"kind":"ImageStreamTag","name":"nationalparks-py:latest","namespace":"div"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"nationalparks-py\\")].image","pause":"true"}]',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
      isFromDevfile: 'true',
    },
    name: 'nationalparks-py',
    namespace: 'div',
    labels: {
      app: 'nationalparks-py',
      'app.kubernetes.io/component': 'nationalparks-py',
      'app.kubernetes.io/instance': 'nationalparks-py',
      'app.kubernetes.io/name': 'python',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.8-ubi7',
      'test-resource': 'devfile',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: 'nationalparks-py',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'nationalparks-py',
          deploymentconfig: 'nationalparks-py',
          'test-app': 'nationalparks-py',
        },
      },
      spec: {
        containers: [
          {
            name: 'nationalparks-py',
            image:
              'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:8b187a8f235f42e7ea3e21e740c4940fdfa3ec8b59a14bb1cd9a67ffedf2eef9',
            ports: [
              {
                containerPort: 8080,
                protocol: 'TCP',
              },
            ],
            env: [
              {
                name: 'dev',
                value: 'test',
              },
            ],
            resources: {},
          },
        ],
      },
    },
  },
};

export const originalBuildConfig = {
  kind: 'BuildConfig',
  apiVersion: 'build.openshift.io/v1',
  metadata: {
    name: 'nationalparks-py',
    namespace: 'div',
    labels: {
      app: 'nationalparks-py',
      'app.kubernetes.io/component': 'nationalparks-py',
      'app.kubernetes.io/instance': 'nationalparks-py',
      'app.kubernetes.io/name': 'python',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.6',
    },
    annotations: {
      'app.openshift.io/vcs-ref': 'master',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
  },
  spec: {
    nodeSelector: null,
    output: {
      to: {
        kind: 'ImageStreamTag',
        name: 'nationalparks-py:latest',
      },
    },
    resources: {},
    successfulBuildsHistoryLimit: 5,
    failedBuildsHistoryLimit: 5,
    strategy: {
      type: 'Source',
      sourceStrategy: {
        from: {
          kind: 'ImageStreamTag',
          namespace: 'openshift',
          name: 'python:3.6',
        },
      },
    },
    postCommit: {},
    source: {
      type: 'Git',
      git: {
        uri: 'https://github.com/divyanshiGupta/nationalparks-py',
      },
      contextDir: '/',
    },
    triggers: [
      {
        type: 'Generic',
        generic: {
          secretReference: {
            name: 'nationalparks-py-generic-webhook-secret',
          },
        },
      },
      {
        type: 'GitHub',
        github: {
          secretReference: {
            name: 'nationalparks-py-github-webhook-secret',
          },
        },
      },
      {
        type: 'ImageChange',
        imageChange: {
          lastTriggeredImageID:
            'image-registry.openshift-image-registry.svc:5000/openshift/python@sha256:dde8883b3033d9b3d0e88b8c74304fba4b23cd5c07a164e71ee352b899a7803e',
        },
      },
      {
        type: 'ConfigChange',
      },
    ],
  },
};

export const newBuildConfig = {
  kind: 'BuildConfig',
  apiVersion: 'build.openshift.io/v1',
  metadata: {
    name: 'nationalparks-py',
    namespace: 'div',
    labels: {
      app: 'nationalparks-py',
      'app.kubernetes.io/component': 'nationalparks-py',
      'app.kubernetes.io/instance': 'nationalparks-py',
      'app.kubernetes.io/name': 'python',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.6',
      'test-app': 'nationalparks-py',
    },
    annotations: {
      'app.openshift.io/vcs-ref': 'master',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
  },
  spec: {
    nodeSelector: null,
    output: {
      to: {
        kind: 'ImageStreamTag',
        name: 'nationalparks-py:latest',
      },
    },
    resources: {},
    successfulBuildsHistoryLimit: 5,
    failedBuildsHistoryLimit: 5,
    strategy: {
      type: 'Source',
      sourceStrategy: {
        env: [{ name: 'PYTHON_PROJECT', value: 'nationalparks-py' }],
        from: {
          kind: 'ImageStreamTag',
          namespace: 'openshift',
          name: 'python:3.6',
        },
      },
    },
    postCommit: {},
    source: {
      type: 'Git',
      git: {
        uri: 'https://github.com/divyanshiGupta/nationalparks-py',
      },
      contextDir: '/',
    },
    triggers: [
      {
        type: 'Generic',
        generic: {
          secretReference: {
            name: 'nationalparks-py-generic-webhook-secret',
          },
        },
      },
      {
        type: 'GitHub',
        github: {
          secretReference: {
            name: 'nationalparks-py-github-webhook-secret',
          },
        },
      },
      {
        type: 'ImageChange',
        imageChange: {
          lastTriggeredImageID:
            'image-registry.openshift-image-registry.svc:5000/openshift/python@sha256:dde8883b3033d9b3d0e88b8c74304fba4b23cd5c07a164e71ee352b899a7803e',
        },
      },
      {
        type: 'ConfigChange',
      },
    ],
  },
};

export const originalDeploymentConfig = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps.openshift.io/v1',
  metadata: {
    annotations: {
      'app.openshift.io/vcs-ref': 'master',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
    namespace: 'div',
    labels: {
      app: 'nationalparks-py',
      'app.kubernetes.io/component': 'nationalparks-py',
      'app.kubernetes.io/instance': 'nationalparks-py',
      'app.kubernetes.io/name': 'python',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.6',
      'app.openshift.io/runtime-namespace': 'div',
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
          containerNames: ['nationalparks-py'],
          from: {
            kind: 'ImageStreamTag',
            namespace: 'div',
            name: 'nationalparks-py:latest',
          },
          lastTriggeredImage:
            'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:7d67c08b5b993d72533f9bb07b6429c5a2263de8b67cc1b0ae09d4c0b0d39f97',
        },
      },
      {
        type: 'ConfigChange',
      },
    ],
    replicas: 1,
    selector: {
      app: 'nationalparks-py',
      deploymentconfig: 'nationalparks-py',
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          app: 'nationalparks-py',
          deploymentconfig: 'nationalparks-py',
        },
      },
      spec: {
        containers: [
          {
            name: 'nationalparks-py',
            image:
              'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:7d67c08b5b993d72533f9bb07b6429c5a2263de8b67cc1b0ae09d4c0b0d39f97',
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
      },
    },
  },
};

export const newDeploymentConfig = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps.openshift.io/v1',
  metadata: {
    annotations: {
      'app.openshift.io/vcs-ref': 'master',
      'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
    namespace: 'div',
    labels: {
      app: 'nationalparks-py',
      'app.kubernetes.io/component': 'nationalparks-py',
      'app.kubernetes.io/instance': 'nationalparks-py',
      'app.kubernetes.io/name': 'python',
      'app.openshift.io/runtime': 'python',
      'app.openshift.io/runtime-version': '3.6',
      'app.openshift.io/runtime-namespace': 'div',
      'test-app': 'nationalparks-py',
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
          automatic: false,
          containerNames: ['nationalparks-py'],
          from: {
            kind: 'ImageStreamTag',
            namespace: 'div',
            name: 'nationalparks-py:latest',
          },
          lastTriggeredImage:
            'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:7d67c08b5b993d72533f9bb07b6429c5a2263de8b67cc1b0ae09d4c0b0d39f97',
        },
      },
      {
        type: 'ConfigChange',
      },
    ],
    replicas: 1,
    selector: {
      app: 'nationalparks-py',
      deploymentconfig: 'nationalparks-py',
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          app: 'nationalparks-py',
          deploymentconfig: 'nationalparks-py',
        },
      },
      spec: {
        containers: [
          {
            name: 'nationalparks-py',
            image:
              'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:7d67c08b5b993d72533f9bb07b6429c5a2263de8b67cc1b0ae09d4c0b0d39f97',
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
      },
    },
  },
};
