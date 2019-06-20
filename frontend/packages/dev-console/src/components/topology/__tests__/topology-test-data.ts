import { TopologyDataModel, TopologyDataResources, Resource } from '../topology-types';

export const resources: TopologyDataResources = {
  replicationControllers: { data: [] },
  pods: { data: [] },
  deploymentConfigs: { data: [] },
  services: { data: [] },
  routes: { data: [] },
  deployments: { data: [] },
  replicasets: { data: [] },
  buildconfigs: { data: [] },
};

export const topologyData: TopologyDataModel = {
  graph: { nodes: [], edges: [], groups: [] },
  topology: {},
};

export const sampleDeploymentConfigs: Resource = {
  data: [
    {
      kind: 'DeploymentConfig',
      apiVersion: 'apps/v1',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject1',
        selfLink: '/apis/apps.openshift.io/v1/namespaces/testproject1/deploymentconfigs/nodejs',
        uid: '02f680df-680f-11e9-b69e-5254003f9382',
        resourceVersion: '732186',
        generation: 2,
        creationTimestamp: '2019-04-22T11:58:33Z',
        labels: {
          app: 'nodejs',
        },
      },
      spec: {
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'nodejs',
              deploymentconfig: 'nodejs',
            },
          },
          spec: {},
        },
      },
      status: {
        availableReplicas: 1,
        unavailableReplicas: 0,
        latestVersion: 1,
        updatedReplicas: 1,
        replicas: 1,
        readyReplicas: 1,
      },
    },
  ],
};
export const sampleDeployments = {
  data: [
    {
      kind: 'Deployment',
      name: 'analytics-deployment',
      apiVersion: 'apps/v1',
      metadata: {
        annotations: {
          'app.openshift.io/connects-to': '["wit"]',
        },
        selfLink: '/apis/apps/v1/namespaces/testproject1/deployments/analytics-deployment',
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
          spec: {},
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
    },
    {
      kind: 'Deployment',
      name: 'wit-deployment',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
        },
        selfLink: '/apis/apps/v1/namespaces/testproject1/deployments/wit-deployment',
        resourceVersion: '726179',
        name: 'wit-deployment',
        uid: '60a9b423-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-22T11:35:43Z',
        generation: 2,
        namespace: 'testproject1',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            'app.kubernetes.io/component': 'backend',
            'app.kubernetes.io/instance': 'wit',
            'app.kubernetes.io/name': 'nodejs',
            'app.kubernetes.io/part-of': 'application-1',
            'app.kubernetes.io/version': '1.0',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'app.kubernetes.io/component': 'backend',
              'app.kubernetes.io/instance': 'wit',
              'app.kubernetes.io/name': 'nodejs',
              'app.kubernetes.io/part-of': 'application-1',
              'app.kubernetes.io/version': '1.0',
            },
          },
          spec: {},
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
    },
  ],
};

export const samplePods: Resource = {
  data: [
    {
      kind: 'Pod',
      metadata: {
        generateName: 'analytics-deployment-59dd7c47d4-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/analytics-deployment-59dd7c47d4-2jp7t',
        resourceVersion: '1395096',
        name: 'analytics-deployment-59dd7c47d4-2jp7t',
        uid: '5cec460e-680d-11e9-8c69-5254003f9382',
        creationTimestaResourcePropsmp: '2019-04-26T10:23:41Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'analytics-deployment-59dd7c47d4',
            uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      metadata: {
        generateName: 'analytics-deployment-59dd7c47d4-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/analytics-deployment-59dd7c47d4-6btjb',
        resourceVersion: '1394896',
        name: 'analytics-deployment-59dd7c47d4-6btjb',
        uid: 'c4592a49-683c-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T16:03:01Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'analytics-deployment-59dd7c47d4',
            uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {
        constainers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      metadata: {
        generateName: 'analytics-deployment-59dd7c47d4-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/analytics-deployment-59dd7c47d4-n4zrh',
        resourceVersion: '1394826',
        name: 'analytics-deployment-59dd7c47d4-n4zrh',
        uid: '5cec1049-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:41Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'analytics-deployment-59dd7c47d4',
            uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {
        constainers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      metadata: {
        generateName: 'nodejs-1-',
        annotations: {
          'openshift.io/deployment-config.latest-version': '1',
          'openshift.io/deployment-config.name': 'nodejs',
          'openshift.io/deployment.name': 'nodejs-1',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/nodejs-1-2v82p',
        resourceVersion: '1161178',
        name: 'nodejs-1-2v82p',
        uid: '19e6c6a5-680f-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:36:07Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind: 'ReplicationController',
            name: 'nodejs-1',
            uid: '18c94ccd-680f-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'nodejs',
          deployment: 'nodejs-1',
          deploymentconfig: 'nodejs',
        },
      },
      spec: {
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      metadata: {
        annotations: {
          'openshift.io/build.name': 'nodejs-1',
          'openshift.io/scc': 'privileged',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/nodejs-1-build',
        resourceVersion: '1161133',
        name: 'nodejs-1-build',
        uid: '0361f689-680f-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:35:30Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'build.openshift.io/v1',
            kind: 'Build',
            name: 'nodejs-1',
            uid: '0335fc81-680f-11e9-b69e-5254003f9382',
            controller: true,
          },
        ],
        labels: {
          'openshift.io/build.name': 'nodejs-1',
        },
      },
      spec: {},

      status: {
        phase: 'Succeeded',
      },
    },
    {
      kind: 'Pod',
      metadata: {
        generateName: 'wit-deployment-656cc8b469-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/wit-deployment-656cc8b469-2n6nl',
        resourceVersion: '1394776',
        name: 'wit-deployment-656cc8b469-2n6nl',
        uid: '610c7d95-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:48Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'wit-deployment-656cc8b469',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {},

      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      metadata: {
        generateName: 'wit-deployment-656cc8b469-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/wit-deployment-656cc8b469-kzh9c',
        resourceVersion: '1394914',
        name: 'wit-deployment-656cc8b469-kzh9c',
        uid: '60dbfd78-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:48Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'wit-deployment-656cc8b469',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {},
      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      metadata: {
        generateName: 'wit-deployment-656cc8b469-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/wit-deployment-656cc8b469-r5nlj',
        resourceVersion: '1395115',
        name: 'wit-deployment-656cc8b469-r5nlj',
        uid: '610bbd96-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:48Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'wit-deployment-656cc8b469',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {},
      status: {
        phase: 'Running',
      },
    },
  ],
};

export const sampleReplicationControllers: Resource = {
  data: [
    {
      kind: 'ReplicationController',
      metadata: {
        annotations: {
          'openshift.io/deployment-config.name': 'nodejs',
          'openshift.io/deployer-pod.completed-at': '2019-04-26 10:36:10 +0000 UTC',
          'openshift.io/deployment.phase': 'Complete',
        },
        selfLink: '/api/v1/namespaces/testproject3/replicationcontrollers/nodejs-1',
        resourceVersion: '1161189',
        name: 'nodejs-1',
        uid: '18c94ccd-680f-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:36:06Z',
        generation: 2,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps.openshift.io/v1',
            kind: 'DeploymentConfig',
            name: 'nodejs',
            uid: '02f680df-680f-11e9-b69e-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'nodejs',
          'openshift.io/deployment-config.name': 'nodejs',
        },
      },
      spec: {},
      status: {
        replicas: 1,
        fullyLabeledReplicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        observedGeneration: 2,
      },
    },
  ],
};

export const sampleReplicaSets: Resource = {
  data: [
    {
      kind: 'ReplicaSet',
      apiVersion: 'apps/v1',
      metadata: {
        annotations: {
          'app.openshift.io/connects-to': '["wit"]',
          'deployment.kubernetes.io/desired-replicas': '3',
          'deployment.kubernetes.io/max-replicas': '4',
          'deployment.kubernetes.io/revision': '1',
          'deployment.kubernetes.io/revision-history': '1,1,1',
        },
        selfLink:
          '/apis/apps/v1/namespaces/testproject3/replicasets/analytics-deployment-59dd7c47d4',
        resourceVersion: '1398999',
        name: 'analytics-deployment-59dd7c47d4',
        uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:41Z',
        generation: 3,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'analytics-deployment',
            uid: '5ca9ae28-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {},
      status: {
        replicas: 3,
        fullyLabeledReplicas: 3,
        observedGeneration: 3,
      },
    },
    {
      kind: 'ReplicaSet',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/desired-replicas': '3',
          'deployment.kubernetes.io/max-replicas': '4',
          'deployment.kubernetes.io/revision': '1',
        },
        selfLink: '/apis/apps/v1/namespaces/testproject3/replicasets/wit-deployment-656cc8b469',
        resourceVersion: '1389053',
        name: 'wit-deployment-656cc8b469',
        uid: '60a9b423-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:47Z',
        generation: 1,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'wit-deployment',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {},
      status: {
        replicas: 3,
        fullyLabeledReplicas: 3,
        observedGeneration: 1,
      },
    },
  ],
};

export const sampleServices: Resource = {
  data: [
    {
      kind: 'Service',
      metadata: {
        name: 'analytics-service',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/analytics-service',
        uid: '5cb930e0-680d-11e9-8c69-5254003f9382',
        resourceVersion: '1157349',
        creationTimestamp: '2019-04-26T10:23:41Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"analytics","app.kubernetes.io/name":"python","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"analytics-service","namespace":"testproject3"},"spec":{"ports":[{"port":80}],"selector":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"analytics","app.kubernetes.io/name":"analytics","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"}}}\n',
        },
      },
      spec: {
        selector: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      kind: 'Service',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/nodejs',
        uid: '02f53542-680f-11e9-8c69-5254003f9382',
        resourceVersion: '1160881',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'nodejs',
        },
      },
      spec: {
        selector: {
          app: 'nodejs',
          deploymentconfig: 'nodejs',
        },
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      kind: 'Service',
      metadata: {
        name: 'wit-service',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/wit-service',
        uid: '60e010cc-680d-11e9-8c69-5254003f9382',
        resourceVersion: '1157449',
        creationTimestamp: '2019-04-26T10:23:48Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"wit-service","namespace":"testproject3"},"spec":{"ports":[{"port":80}],"selector":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"}}}\n',
        },
      },
      spec: {
        selector: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      status: {
        loadBalancer: {},
      },
    },
  ],
};
export const sampleRoutes: Resource = {
  data: [
    {
      kind: 'Route',
      metadata: {
        name: 'analytics-route',
        namespace: 'testproject3',
        selfLink: '/apis/route.openshift.io/v1/namespaces/testproject3/routes/analytics-route',
        uid: '5cb4135f-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1157355',
        creationTimestamp: '2019-04-26T10:23:41Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"route.openshift.io/v1","kind":"Route","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"analytics","app.kubernetes.io/name":"python","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"analytics-route","namespace":"testproject3"},"spec":{"host":"analytics.io","path":"/","to":{"kind":"Service","name":"analytics-service"}}}\n',
        },
      },
      spec: {
        host: 'analytics.io',
        to: {
          kind: 'Service',
          name: 'analytics-service',
          weight: 100,
        },
      },
      status: {},
    },
    {
      kind: 'Route',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject3',
        selfLink: '/apis/route.openshift.io/v1/namespaces/testproject3/routes/nodejs',
        uid: '02f63696-680f-11e9-b69e-5254003f9382',
        resourceVersion: '1160889',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'nodejs',
        },
        annotations: {
          'openshift.io/host.generated': 'true',
        },
      },
      spec: {
        host: 'nodejs-testproject3.192.168.42.60.nip.io',
        to: {
          kind: 'Service',
          name: 'nodejs',
          weight: 100,
        },
      },
      status: {},
    },
    {
      kind: 'Route',
      metadata: {
        name: 'wit-route',
        namespace: 'testproject3',
        selfLink: '/apis/route.openshift.io/v1/namespaces/testproject3/routes/wit-route',
        uid: '60dba9b8-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1157450',
        creationTimestamp: '2019-04-26T10:23:48Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"route.openshift.io/v1","kind":"Route","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"wit-route","namespace":"testproject3"},"spec":{"host":"wit.io","path":"/","to":{"kind":"Service","name":"wit-service"}}}\n',
        },
      },
      spec: {
        host: 'wit.io',
        to: {
          kind: 'Service',
          name: 'wit-service',
          weight: 100,
        },
      },
      status: {},
    },
  ],
};

const sampleBuildConfigs: Resource = {
  data: [
    {
      kind: 'BuildConfig',
      metadata: {
        name: 'analytics-build',
        namespace: 'testproject3',
        selfLink:
          '/apis/build.openshift.io/v1/namespaces/testproject3/buildconfigs/analytics-build',
        uid: '5ca46c49-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1772624',
        creationTimestamp: '2019-04-26T10:23:40Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'user-analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'app.openshift.io/vcs-ref': 'v1.0.0',
          'app.openshift.io/vcs-uri': 'git@github.com:redhat-developer/topology-example.git',
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"build.openshift.io/v1","kind":"BuildConfig","metadata":{"annotations":{"app.openshift.io/vcs-ref":"v1.0.0","app.openshift.io/vcs-uri":"git@github.com:redhat-developer/topology-example.git"},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"user-analytics","app.kubernetes.io/name":"python","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"analytics-build","namespace":"testproject3"},"spec":{"output":{"to":{"kind":"ImageStreamTag","name":"analytics-build:latest"}},"source":{"git":{"uri":"git@github.com:DhritiShikhar/topology-example.git"},"type":"Git"},"strategy":{"dockerStrategy":{"noCache":true}}}}\n',
        },
      },
      spec: {},
      status: {
        lastVersion: 1,
      },
    },
    {
      kind: 'BuildConfig',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject3',
        selfLink: '/apis/build.openshift.io/v1/namespaces/testproject3/buildconfigs/nodejs',
        uid: '02fc958f-680f-11e9-b69e-5254003f9382',
        resourceVersion: '1160891',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'nodejs',
        },
      },
      spec: {},
      status: {
        lastVersion: 1,
      },
    },
    {
      kind: 'BuildConfig',
      metadata: {
        name: 'wit-build',
        namespace: 'testproject3',
        selfLink: '/apis/build.openshift.io/v1/namespaces/testproject3/buildconfigs/wit-build',
        uid: '608914d2-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1157436',
        creationTimestamp: '2019-04-26T10:23:47Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'app.openshift.io/vcs-ref': 'v1.0.0',
          'app.openshift.io/vcs-uri': 'git@github.com:redhat-developer/topology-example.git',
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"build.openshift.io/v1","kind":"BuildConfig","metadata":{"annotations":{"app.openshift.io/vcs-ref":"v1.0.0","app.openshift.io/vcs-uri":"git@github.com:redhat-developer/topology-example.git"},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"wit-build","namespace":"testproject3"},"spec":{"output":{"to":{"kind":"ImageStreamTag","name":"wit-build:latest"}},"source":{"git":{"uri":"git@github.com:DhritiShikhar/topology-example.git"},"type":"Git"},"strategy":{"dockerStrategy":{"noCache":true}}}}\n',
        },
      },
      spec: {},
      status: {
        lastVersion: 0,
      },
    },
  ],
};

export const MockResources: TopologyDataResources = {
  deployments: sampleDeployments,
  deploymentConfigs: sampleDeploymentConfigs,
  replicationControllers: sampleReplicationControllers,
  replicasets: sampleReplicaSets,
  pods: samplePods,
  services: sampleServices,
  routes: sampleRoutes,
  buildconfigs: sampleBuildConfigs,
};
