import { FirehoseResult } from '@console/internal/components/utils';
import { DeploymentKind, PodKind, EventKind, ImagePullPolicy } from '@console/internal/module/k8s';
import { Model } from '@console/topology';
import { TopologyDataResources } from '../topology-types';
import { NODE_HEIGHT, NODE_PADDING, NODE_WIDTH } from '../components/const';
import { WorkloadModelProps } from '../data-transforms';

export const TEST_KINDS_MAP = {
  deploymentConfigs: 'DeploymentConfig',
  deployments: 'Deployment',
  daemonSets: 'DaemonSet',
  pods: 'Pod',
  replicationControllers: 'ReplicationController',
  routes: 'Route',
  services: 'Service',
  replicaSets: 'ReplicaSet',
  buildConfigs: 'BuildConfig',
  builds: 'Build',
  statefulSets: 'StatefulSet',
  secrets: 'Secret',
  clusterServiceVersions: 'operators.coreos.com~v1alpha1~ClusterServiceVersion',
  serviceBindingRequests: 'apps.openshift.io~v1alpha1~ServiceBindingRequest',
  revisions: 'serving.knative.dev~v1~Revision',
  configurations: 'serving.knative.dev~v1~Configuration',
  ksroutes: 'serving.knative.dev~v1~Route',
  ksservices: 'serving.knative.dev~v1~Service',
  'sources.knative.dev~v1alpha1~ApiServerSource': 'sources.knative.dev~v1alpha1~ApiServerSource',
  'sources.eventing.knative.dev~v1alpha1~ContainerSource':
    'sources.eventing.knative.dev~v1alpha1~ContainerSource',
  'sources.eventing.knative.dev~v1alpha1~CronJobSource':
    'sources.eventing.knative.dev~v1alpha1~CronJobSource',
  'sources.knative.dev~v1alpha1~KafkaSource': 'sources.knative.dev~v1alpha1~KafkaSource',
  'sources.knative.dev~v1alpha1~PingSource': 'sources.knative.dev~v1alpha1~PingSource',
  'sources.knative.dev~v1alpha1~SinkBinding': 'sources.knative.dev~v1alpha1~SinkBinding',
  virtualmachines: 'VirtualMachine',
  virtualmachineinstances: 'VirtualMachineInstance',
  virtualmachinetemplates: 'Template',
  migrations: 'VirtualMachineInstanceMigration',
  dataVolumes: 'DataVolume',
  vmImports: 'VirtualMachineImport',
  brokers: 'Broker',
  triggers: 'Trigger',
};

export const resources: TopologyDataResources = {
  replicationControllers: { loaded: true, loadError: '', data: [] },
  pods: { loaded: true, loadError: '', data: [] },
  deploymentConfigs: { loaded: true, loadError: '', data: [] },
  services: { loaded: true, loadError: '', data: [] },
  routes: { loaded: true, loadError: '', data: [] },
  deployments: { loaded: true, loadError: '', data: [] },
  replicaSets: { loaded: true, loadError: '', data: [] },
  buildConfigs: { loaded: true, loadError: '', data: [] },
  builds: { loaded: true, loadError: '', data: [] },
  daemonSets: { loaded: true, loadError: '', data: [] },
  statefulSets: { loaded: true, loadError: '', data: [] },
  pipelineRuns: { loaded: true, loadError: '', data: [] },
  pipelines: { loaded: true, loadError: '', data: [] },
  events: { loaded: true, loadError: '', data: [] },
};

export const topologyData: Model = {
  nodes: [],
  edges: [],
};

export const sampleDeploymentConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
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
          'app.kubernetes.io/instance': 'nodejs',
          'app.openshift.io/runtime': 'nodejs',
        },
        annotations: {
          'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
          'app.openshift.io/vcs-ref': 'master',
        },
      },
      spec: {
        strategy: {
          type: 'Rolling',
        },
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
        triggers: [
          {
            type: 'ImageChange',
            imageChangeParams: {
              automatic: true,
              containerNames: ['nodejs'],
              from: {
                kind: 'ImageStreamTag',
                namespace: 'testproject1',
                name: 'nodejs:latest',
              },
            },
          },
          {
            type: 'ConfigChange',
          },
        ],
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
    {
      kind: 'DeploymentConfig',
      apiVersion: 'apps/v1',
      metadata: {
        name: 'nodejs-ex',
        namespace: 'testproject1',
        selfLink: '/apis/apps.openshift.io/v1/namespaces/testproject1/deploymentconfigs/nodejs',
        uid: '02f680df-b69e-5254003f9382',
        resourceVersion: '732186',
        generation: 2,
        creationTimestamp: '2019-04-22T11:58:33Z',
        labels: {
          app: 'nodejs-ex',
          'app.kubernetes.io/instance': 'nodejs-ex',
          'app.openshift.io/runtime': 'nodejs',
        },
        annotations: {
          'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
          'app.openshift.io/vcs-ref': 'master',
        },
      },
      spec: {
        strategy: {
          type: 'Rolling',
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'nodejs-ex',
              deploymentconfig: 'nodejs-ex',
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
export const sampleDeployments: FirehoseResult<DeploymentKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Deployment',
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
    },
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
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
          spec: {
            containers: [
              {
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                name: 'wit-deployment',
                ports: [
                  {
                    containerPort: 8080,
                    protocol: 'TCP',
                  },
                ],
                imagePullPolicy: ImagePullPolicy.Always,
                terminationMessagePolicy: 'File',
                image:
                  'image-registry.openshift-image-registry.svc:5000/viraj/calculator-react@sha256:84d947d3bb6ae52090c86b5ec7e172dcef2c28a78eedb11a7ff588a3d336d8e0',
              },
              {
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                name: 'wit-deployment-1',
                ports: [
                  {
                    containerPort: 8080,
                    protocol: 'TCP',
                  },
                ],
                imagePullPolicy: ImagePullPolicy.Always,
                terminationMessagePolicy: 'File',
                image:
                  'image-registry.openshift-image-registry.svc:5000/viraj/calculator-react@sha256:84d947d3bb6ae52090c86b5ec7e172dcef2c28a78eedb11a7ff588a3d336d8e0',
              },
            ],
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
    },
    {
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'prometheus.io/port': '14269',
          'prometheus.io/scrape': 'true',
          'sidecar.istio.io/inject': 'false',
        },
        selfLink: '/apis/apps/v1/namespaces/myproj/deployments/jaeger-all-in-one-inmemory',
        resourceVersion: '120365',
        name: 'jaeger-all-in-one-inmemory',
        uid: 'c73277f2-e85c-477c-a43d-330a5d0b2cf6',
        creationTimestamp: '2019-12-15T17:31:52Z',
        generation: 1,
        namespace: 'myproj',
        ownerReferences: [
          {
            apiVersion: 'jaegertracing.io/v1',
            kind: 'Jaeger',
            name: 'jaeger-all-in-one-inmemory',
            uid: '3006a8f3-6e2b-4a19-b37e-fbddd9a41f51',
            controller: true,
          },
        ],
        labels: {
          app: 'jaeger',
          'app.kubernetes.io/component': 'all-in-one',
          'app.kubernetes.io/instance': 'jaeger-all-in-one-inmemory',
          'app.kubernetes.io/managed-by': 'jaeger-operator',
          'app.kubernetes.io/name': 'jaeger-all-in-one-inmemory',
          'app.kubernetes.io/part-of': 'jaeger',
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: 'jaeger',
            'app.kubernetes.io/component': 'all-in-one',
            'app.kubernetes.io/instance': 'jaeger-all-in-one-inmemory',
            'app.kubernetes.io/managed-by': 'jaeger-operator',
            'app.kubernetes.io/name': 'jaeger-all-in-one-inmemory',
            'app.kubernetes.io/part-of': 'jaeger',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'jaeger',
              'app.kubernetes.io/component': 'all-in-one',
              'app.kubernetes.io/instance': 'jaeger-all-in-one-inmemory',
              'app.kubernetes.io/managed-by': 'jaeger-operator',
              'app.kubernetes.io/name': 'jaeger-all-in-one-inmemory',
              'app.kubernetes.io/part-of': 'jaeger',
            },
            annotations: {
              'prometheus.io/port': '14269',
              'prometheus.io/scrape': 'true',
              'sidecar.istio.io/inject': 'false',
            },
          },
          spec: {
            restartPolicy: 'Always',
            serviceAccountName: 'jaeger-all-in-one-inmemory-ui-proxy',
            schedulerName: 'default-scheduler',
            terminationGracePeriodSeconds: 30,
            securityContext: {},
            containers: [
              {
                resources: {},
                livenessProbe: {
                  httpGet: {
                    path: '/healthz',
                    port: 8080,
                    scheme: 'HTTP',
                  },
                  failureThreshold: 1,
                  periodSeconds: 10,
                },
                terminationMessagePath: '/dev/termination-log',
                name: 'jaeger-all-in-one-inmemory',
                ports: [
                  {
                    containerPort: 8080,
                    protocol: 'TCP',
                  },
                ],
                imagePullPolicy: ImagePullPolicy.Always,
                terminationMessagePolicy: 'File',
                image:
                  'image-registry.openshift-image-registry.svc:5000/viraj/calculator-react@sha256:84d947d3bb6ae52090c86b5ec7e172dcef2c28a78eedb11a7ff588a3d336d8e0',
              },
            ],
            serviceAccount: 'jaeger-all-in-one-inmemory-ui-proxy',
            volumes: [],
            dnsPolicy: 'ClusterFirst',
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
      status: {
        observedGeneration: 1,
        replicas: 1,
        updatedReplicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        conditions: [],
      },
      apiVersion: 'apps/v1',
      kind: 'Deployment',
    },
  ],
};

export const samplePods: FirehoseResult<PodKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      metadata: {
        generateName: 'py-cron-1593000600-',
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.50"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.50"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/py-cron-1593000600-pq8jn',
        resourceVersion: '104969',
        name: 'py-cron-1593000600-pq8jn',
        uid: 'd09c22d8-4d12-465c-b178-fbd76db43ed8',
        creationTimestamp: '2020-06-24T12:10:43Z',
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1',
            kind: 'Job',
            name: 'py-cron-1593000600',
            uid: 'c9a27ca7-d258-4acf-a915-a146cacd6924',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': 'c9a27ca7-d258-4acf-a915-a146cacd6924',
          'job-name': 'py-cron-1593000600',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Failed',
      },
    },
    {
      metadata: {
        generateName: 'py-cron-1593000600-',
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.48"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.48"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/py-cron-1593000600-9v5lq',
        resourceVersion: '104275',
        name: 'py-cron-1593000600-9v5lq',
        uid: 'f680a75a-9bd5-4b72-a5da-62477f0a4573',
        creationTimestamp: '2020-06-24T12:10:13Z',
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1',
            kind: 'Job',
            name: 'py-cron-1593000600',
            uid: 'c9a27ca7-d258-4acf-a915-a146cacd6924',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': 'c9a27ca7-d258-4acf-a915-a146cacd6924',
          'job-name': 'py-cron-1593000600',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Failed',
      },
    },
    {
      metadata: {
        generateName: 'py-cron-1593002400-',
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.96"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.96"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/py-cron-1593002400-bzzmm',
        resourceVersion: '132152',
        name: 'py-cron-1593002400-bzzmm',
        uid: 'c5f81e7f-a373-41f7-912a-55940642cc4e',
        creationTimestamp: '2020-06-24T12:42:40Z',
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1',
            kind: 'Job',
            name: 'py-cron-1593002400',
            uid: '3410e32d-309d-453e-889a-065c116eada5',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': '3410e32d-309d-453e-889a-065c116eada5',
          'job-name': 'py-cron-1593002400',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Failed',
      },
    },
    {
      metadata: {
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.131.0.15"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.131.0.15"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/build.name': 'py-cron-1',
          'openshift.io/scc': 'privileged',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/py-cron-1-build',
        resourceVersion: '60137',
        name: 'py-cron-1-build',
        uid: '67120da8-0c67-4158-892e-d7278d62795d',
        creationTimestamp: '2020-06-24T11:17:41Z',
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'build.openshift.io/v1',
            kind: 'Build',
            name: 'py-cron-1',
            uid: '7b599334-c53b-4559-acfe-532db362106c',
            controller: true,
          },
        ],
        labels: {
          'openshift.io/build.name': 'py-cron-1',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Succeeded',
      },
    },
    {
      metadata: {
        generateName: 'py-cron-1593002400-',
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.91"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.91"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/py-cron-1593002400-hcnrb',
        resourceVersion: '129932',
        name: 'py-cron-1593002400-hcnrb',
        uid: '1bb8b0f1-be63-4e41-b37c-88778fea1722',
        creationTimestamp: '2020-06-24T12:40:06Z',
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1',
            kind: 'Job',
            name: 'py-cron-1593002400',
            uid: '3410e32d-309d-453e-889a-065c116eada5',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': '3410e32d-309d-453e-889a-065c116eada5',
          'job-name': 'py-cron-1593002400',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Failed',
      },
    },
    {
      metadata: {
        generateName: 'py-cron-1593002400-',
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.94"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.94"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/py-cron-1593002400-pvcgm',
        resourceVersion: '130695',
        name: 'py-cron-1593002400-pvcgm',
        uid: '7f65e6ef-26a2-4c55-9665-cc57a6ba7ebe',
        creationTimestamp: '2020-06-24T12:40:40Z',
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1',
            kind: 'Job',
            name: 'py-cron-1593002400',
            uid: '3410e32d-309d-453e-889a-065c116eada5',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': '3410e32d-309d-453e-889a-065c116eada5',
          'job-name': 'py-cron-1593002400',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Failed',
      },
    },
    {
      metadata: {
        generateName: 'standalone-job-',
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.129.2.16"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.129.2.16"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/standalone-job-jchzw',
        resourceVersion: '59798',
        name: 'standalone-job-jchzw',
        uid: '100afa1b-58fd-40cc-b428-6c9c939c4e15',
        creationTimestamp: '2020-06-24T11:17:41Z',
        managedFields: [
          {
            manager: 'kube-controller-manager',
            operation: 'Update',
            apiVersion: 'v1',
            time: '2020-06-24T11:17:41Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:metadata': {
                'f:generateName': {},
                'f:labels': {
                  '.': {},
                  'f:controller-uid': {},
                  'f:job-name': {},
                },
                'f:ownerReferences': {
                  '.': {},
                  'k:{"uid":"c1a988ed-3fd6-4a10-a4a5-7612a28eb48e"}': {
                    '.': {},
                    'f:apiVersion': {},
                    'f:blockOwnerDeletion': {},
                    'f:controller': {},
                    'f:kind': {},
                    'f:name': {},
                    'f:uid': {},
                  },
                },
              },
              'f:spec': {
                'f:containers': {
                  'k:{"name":"pi"}': {
                    '.': {},
                    'f:command': {},
                    'f:image': {},
                    'f:imagePullPolicy': {},
                    'f:name': {},
                    'f:resources': {},
                    'f:terminationMessagePath': {},
                    'f:terminationMessagePolicy': {},
                  },
                },
                'f:dnsPolicy': {},
                'f:enableServiceLinks': {},
                'f:restartPolicy': {},
                'f:schedulerName': {},
                'f:securityContext': {},
                'f:terminationGracePeriodSeconds': {},
              },
            },
          },
          {
            manager: 'multus',
            operation: 'Update',
            apiVersion: 'v1',
            time: '2020-06-24T11:17:44Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:metadata': {
                'f:annotations': {
                  'f:k8s.v1.cni.cncf.io/network-status': {},
                  'f:k8s.v1.cni.cncf.io/networks-status': {},
                },
              },
            },
          },
          {
            manager: 'kubelet',
            operation: 'Update',
            apiVersion: 'v1',
            time: '2020-06-24T11:18:42Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:status': {
                'f:conditions': {
                  'k:{"type":"ContainersReady"}': {
                    '.': {},
                    'f:lastProbeTime': {},
                    'f:lastTransitionTime': {},
                    'f:reason': {},
                    'f:status': {},
                    'f:type': {},
                  },
                  'k:{"type":"Initialized"}': {
                    '.': {},
                    'f:lastProbeTime': {},
                    'f:lastTransitionTime': {},
                    'f:reason': {},
                    'f:status': {},
                    'f:type': {},
                  },
                  'k:{"type":"Ready"}': {
                    '.': {},
                    'f:lastProbeTime': {},
                    'f:lastTransitionTime': {},
                    'f:reason': {},
                    'f:status': {},
                    'f:type': {},
                  },
                },
                'f:containerStatuses': {},
                'f:hostIP': {},
                'f:phase': {},
                'f:podIP': {},
                'f:podIPs': {
                  '.': {},
                  'k:{"ip":"10.129.2.16"}': {
                    '.': {},
                    'f:ip': {},
                  },
                },
                'f:startTime': {},
              },
            },
          },
        ],
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1',
            kind: 'Job',
            name: 'standalone-job',
            uid: 'c1a988ed-3fd6-4a10-a4a5-7612a28eb48e',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': 'c1a988ed-3fd6-4a10-a4a5-7612a28eb48e',
          'job-name': 'standalone-job',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Succeeded',
      },
    },
    {
      metadata: {
        annotations: {
          'k8s.v1.cni.cncf.io/network-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.20"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.20"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'anyuid',
        },
        selfLink: '/api/v1/namespaces/jeff-project/pods/standalone-pod',
        resourceVersion: '59106',
        name: 'standalone-pod',
        uid: 'ef598095-c5d7-413f-8f41-e2b1da622dee',
        creationTimestamp: '2020-06-24T11:17:41Z',
        namespace: 'jeff-project',
        labels: {
          app: 'hello-openshift',
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
      apiVersion: 'v1',
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
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
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
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
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
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
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
      apiVersion: 'v1',
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
      spec: {
        containers: [],
      },

      status: {
        phase: 'Succeeded',
      },
    },
    {
      apiVersion: 'v1',
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
      spec: {
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
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
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
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
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      apiVersion: 'v1',
      metadata: {
        generateName: 'daemonset-testing-',
        annotations: {
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.0.89"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testing/pods/daemonset-testing-62h94',
        resourceVersion: '700638',
        name: 'daemonset-testing-62h94',
        uid: '0c4dd58f-a6e6-11e9-a20f-52fdfc072182',
        creationTimestamp: '2019-07-15T09:50:59Z',
        namespace: 'testing',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'DaemonSet',
            name: 'daemonset-testing',
            uid: '0c4a82c9-a6e6-11e9-a20f-52fdfc072182',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'hello-openshift',
          'controller-revision-hash': '5b58864494',
          'pod-template-generation': '1',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Pending',
        startTime: '2019-07-15T09:50:59Z',
      },
    },
    {
      kind: 'Pod',
      apiVersion: 'v1',
      metadata: {
        name: 'alertmanager-main-0',
        generateName: 'alertmanager-main-',
        namespace: 'openshift-monitoring',
        selfLink: '/api/v1/namespaces/openshift-monitoring/pods/alertmanager-main-0',
        uid: 'db4924ec-adfb-11e9-ac86-062ae0b85aca',
        resourceVersion: '14171',
        creationTimestamp: '2019-07-24T10:14:43Z',
        labels: {
          alertmanager: 'main',
          app: 'alertmanager',
          'controller-revision-hash': 'alertmanager-main-5b9d487b7f',
          'statefulset.kubernetes.io/pod-name': 'alertmanager-main-0',
        },
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'StatefulSet',
            name: 'alertmanager-main',
            uid: 'db365c19-adfb-11e9-ac86-062ae0b85aca',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
        startTime: '2019-07-24T10:14:56Z',
      },
    },
  ],
};

export const sampleReplicationControllers: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'v1',
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

export const sampleReplicaSets: FirehoseResult = {
  loaded: true,
  loadError: '',
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

export const sampleServices: FirehoseResult = {
  loaded: true,
  loadError: '',
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
export const sampleRoutes: FirehoseResult = {
  loaded: true,
  loadError: '',
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

export const sampleBuildConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      metadata: {
        name: 'py-cron',
        namespace: 'jeff-project',
        selfLink: '/apis/build.openshift.io/v1/namespaces/jeff-project/buildconfigs/py-cron',
        uid: '73d2d812-29aa-4b6a-87e0-d69fcf3ed0cd',
        resourceVersion: '58983',
        creationTimestamp: '2020-06-24T11:17:40Z',
        labels: {
          app: 'py-cron',
        },
      },
      spec: {
        nodeSelector: null,
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'py-cron:1.0',
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
            uri: 'https://github.com/clcollins/openshift-cronjob-example.git',
            ref: 'master',
          },
        },
        runPolicy: 'Serial',
      },
      status: {
        lastVersion: 1,
      },
    },
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
      spec: {
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'nodejs:latest',
          },
        },
        triggers: [
          { type: 'Generic', generic: {} },
          { type: 'Github', github: {} },
        ],
      },
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

export const sampleBuilds: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Builds',
      metadata: {
        annotations: {
          'openshift.io/build-config.name': 'analytics-build',
          'openshift.io/build.number': '1',
        },
        selfLink: '/apis/build.openshift.io/v1/namespaces/testproject3/builds/analytics-build-1',
        resourceVersion: '358822',
        name: 'analytics-build-1',
        uid: '58d6b528-9c89-11e9-80f4-0a580a82001a',
        creationTimestamp: '2019-07-02T05:22:12Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'build.openshift.io/v1',
            kind: 'BuildConfig',
            name: 'analytics-build',
            uid: '5ca46c49-680d-11e9-b69e-5254003f9382',
            controller: true,
          },
        ],
        labels: {
          app: 'analytics-build',
          'app.kubernetes.io/component': 'analytics-build',
          'app.kubernetes.io/instance': 'analytics-build',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'myapp',
          buildconfig: 'analytics-build',
          'openshift.io/build-config.name': 'analytics-build',
          'openshift.io/build.start-policy': 'Serial',
        },
      },
      spec: {
        serviceAccount: 'builder',
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/fabric8-ui/fabric8-ui',
          },
          contextDir: '/',
        },
        strategy: {
          type: 'Source',
          sourceStrategy: {
            from: {
              kind: 'DockerImage',
              name:
                'image-registry.openshift-image-registry.svc:5000/openshift/nodejs@sha256:0ad231dc2d1c34ed3fb29fb304821171155e0a1a23f0e0490b2cd8ca60915517',
            },
            pullSecret: {
              name: 'builder-dockercfg-tx6qx',
            },
          },
        },
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'analytics-build:latest',
          },
        },
        resources: {},
        postCommit: {},
        nodeSelector: null,
        triggeredBy: [
          {
            message: 'Image change',
            imageChangeBuild: {
              imageID:
                'image-registry.openshift-image-registry.svc:5000/openshift/nodejs@sha256:0ad231dc2d1c34ed3fb29fb304821171155e0a1a23f0e0490b2cd8ca60915517',
              fromRef: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'nodejs:10',
              },
            },
          },
        ],
      },
      status: {
        phase: 'New',
        reason: 'CannotCreateBuildPod',
        message: 'Failed creating build pod.',
        config: {
          kind: 'BuildConfig',
          namespace: 'testproject3',
          name: 'analytics-build',
        },
        output: {},
      },
    },
  ],
};

export const sampleDaemonSets: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      metadata: {
        name: 'daemonset-testing',
        namespace: 'testing',
        selfLink: '/apis/apps/v1/namespaces/testing/daemonsets/daemonset-testing',
        uid: '0c4a82c9-a6e6-11e9-a20f-52fdfc072182',
        resourceVersion: '700614',
        generation: 1,
        creationTimestamp: '2019-07-15T09:50:59Z',
        annotations: {
          'deprecated.daemonset.template.generation': '1',
        },
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'hello-openshift',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'hello-openshift',
            },
          },
          spec: {
            containers: [
              {
                name: 'hello-openshift',
                image: 'openshift/hello-openshift',
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
        updateStrategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: 1,
          },
        },
        revisionHistoryLimit: 10,
      },
      status: {
        currentNumberScheduled: 1,
        numberMisscheduled: 0,
        desiredNumberScheduled: 1,
        numberReady: 0,
        observedGeneration: 1,
        updatedNumberScheduled: 1,
        numberUnavailable: 1,
      },
      kind: 'DaemonSet',
      apiVersion: 'apps/v1',
    },
  ],
};

export const sampleStatefulSets: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      metadata: {
        name: 'alertmanager-main',
        namespace: 'openshift-monitoring',
        selfLink: '/apis/apps/v1/namespaces/openshift-monitoring/statefulsets/alertmanager-main',
        uid: 'db365c19-adfb-11e9-ac86-062ae0b85aca',
        resourceVersion: '14506',
        generation: 1,
        creationTimestamp: '2019-07-24T10:14:43Z',
        labels: {
          alertmanager: 'main',
        },
        ownerReferences: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            kind: 'Alertmanager',
            name: 'main',
            uid: 'db2f029d-adfb-11e9-8783-0a4de0430898',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            alertmanager: 'main',
            app: 'alertmanager',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              alertmanager: 'main',
              app: 'alertmanager',
            },
          },
          spec: {
            containers: [
              {
                name: 'alertmanager',
                image:
                  'registry.svc.ci.openshift.org/ocp/4.2-2019-07-24-010407@sha256:7f17f55f2f3901d83ad1757ffb1c617963e713916e54c870531446e8f80edc8a',
                args: [
                  '--config.file=/etc/alertmanager/config/alertmanager.yaml',
                  '--cluster.listen-address=[$(POD_IP)]:6783',
                  '--storage.path=/alertmanager',
                  '--data.retention=120h',
                  '--web.listen-address=127.0.0.1:9093',
                  '--web.external-url=https://alertmanager-main-openshift-monitoring.apps.rorai-cluster3.devcluster.openshift.com/',
                  '--web.route-prefix=/',
                  '--cluster.peer=alertmanager-main-0.alertmanager-operated.openshift-monitoring.svc:6783',
                  '--cluster.peer=alertmanager-main-1.alertmanager-operated.openshift-monitoring.svc:6783',
                  '--cluster.peer=alertmanager-main-2.alertmanager-operated.openshift-monitoring.svc:6783',
                ],
                ports: [
                  {
                    name: 'mesh',
                    containerPort: 6783,
                    protocol: 'TCP',
                  },
                ],
                env: [
                  {
                    name: 'POD_IP',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath: 'status.podIP',
                      },
                    },
                  },
                ],
                resources: {
                  requests: {
                    memory: '200Mi',
                  },
                },
                volumeMounts: [
                  {
                    name: 'config-volume',
                    mountPath: '/etc/alertmanager/config',
                  },
                  {
                    name: 'alertmanager-main-db',
                    mountPath: '/alertmanager',
                  },
                  {
                    name: 'secret-alertmanager-main-tls',
                    readOnly: true,
                    mountPath: '/etc/alertmanager/secrets/alertmanager-main-tls',
                  },
                  {
                    name: 'secret-alertmanager-main-proxy',
                    readOnly: true,
                    mountPath: '/etc/alertmanager/secrets/alertmanager-main-proxy',
                  },
                ],
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'IfNotPresent',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 120,
            dnsPolicy: 'ClusterFirst',
            nodeSelector: {
              'beta.kubernetes.io/os': 'linux',
            },
            serviceAccountName: 'alertmanager-main',
            serviceAccount: 'alertmanager-main',
            securityContext: {},
            schedulerName: 'default-scheduler',
            priorityClassName: 'system-cluster-critical',
          },
        },
        serviceName: 'alertmanager-operated',
        podManagementPolicy: 'OrderedReady',
        updateStrategy: {
          type: 'RollingUpdate',
        },
        revisionHistoryLimit: 10,
      },
      status: {
        observedGeneration: 1,
        replicas: 3,
        readyReplicas: 3,
        currentReplicas: 3,
        updatedReplicas: 3,
        currentRevision: 'alertmanager-main-5b9d487b7f',
        updateRevision: 'alertmanager-main-5b9d487b7f',
        collisionCount: 0,
      },
      kind: 'StatefulSet',
    },
  ],
};

export const sampleJobs: FirehoseResult = {
  data: [
    {
      metadata: {
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
        },
        selfLink: '/apis/batch/v1/namespaces/jeff-project/jobs/py-cron-1593000600',
        resourceVersion: '108691',
        name: 'py-cron-1593000600',
        uid: 'c9a27ca7-d258-4acf-a915-a146cacd6924',
        creationTimestamp: '2020-06-24T12:10:09Z',
        managedFields: [
          {
            manager: 'kube-controller-manager',
            operation: 'Update',
            apiVersion: 'batch/v1',
            time: '2020-06-24T12:14:43Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:metadata': {
                'f:annotations': {
                  '.': {},
                  'f:alpha.image.policy.openshift.io/resolve-names': {},
                },
                'f:ownerReferences': {
                  '.': {},
                  'k:{"uid":"be644703-be4b-4ee5-9d86-fdeb9495569c"}': {
                    '.': {},
                    'f:apiVersion': {},
                    'f:blockOwnerDeletion': {},
                    'f:controller': {},
                    'f:kind': {},
                    'f:name': {},
                    'f:uid': {},
                  },
                },
              },
              'f:spec': {
                'f:backoffLimit': {},
                'f:completions': {},
                'f:parallelism': {},
                'f:template': {
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"py-cron"}': {
                        '.': {},
                        'f:env': {
                          '.': {},
                          'k:{"name":"HOST"}': {
                            '.': {},
                            'f:name': {},
                            'f:value': {},
                          },
                          'k:{"name":"NAMESPACE"}': {
                            '.': {},
                            'f:name': {},
                            'f:valueFrom': {
                              '.': {},
                              'f:fieldRef': {
                                '.': {},
                                'f:apiVersion': {},
                                'f:fieldPath': {},
                              },
                            },
                          },
                        },
                        'f:image': {},
                        'f:imagePullPolicy': {},
                        'f:name': {},
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
              'f:status': {
                'f:conditions': {
                  '.': {},
                  'k:{"type":"Failed"}': {
                    '.': {},
                    'f:lastProbeTime': {},
                    'f:lastTransitionTime': {},
                    'f:message': {},
                    'f:reason': {},
                    'f:status': {},
                    'f:type': {},
                  },
                },
                'f:failed': {},
                'f:startTime': {},
              },
            },
          },
        ],
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1beta1',
            kind: 'CronJob',
            name: 'py-cron',
            uid: 'be644703-be4b-4ee5-9d86-fdeb9495569c',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': 'c9a27ca7-d258-4acf-a915-a146cacd6924',
          'job-name': 'py-cron-1593000600',
        },
      },
      spec: {
        parallelism: 1,
        completions: 1,
        backoffLimit: 6,
        selector: {
          matchLabels: {
            'controller-uid': 'c9a27ca7-d258-4acf-a915-a146cacd6924',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'controller-uid': 'c9a27ca7-d258-4acf-a915-a146cacd6924',
              'job-name': 'py-cron-1593000600',
            },
          },
          spec: {
            containers: [
              {
                name: 'py-cron',
                image:
                  'image-registry.openshift-image-registry.svc:5000/jeff-project/py-cron@sha256:47c25f041c18c19f65b609df38a49a095ca0358dcfd11db77a21a0380905ecac',
                env: [
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
                    name: 'HOST',
                    value: 'https://okd.host:port',
                  },
                ],
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'Always',
              },
            ],
            restartPolicy: 'Never',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        conditions: [
          {
            type: 'Failed',
            status: 'True',
            lastProbeTime: '2020-06-24T12:14:43Z',
            lastTransitionTime: '2020-06-24T12:14:43Z',
            reason: 'BackoffLimitExceeded',
            message: 'Job has reached the specified backoff limit',
          },
        ],
        startTime: '2020-06-24T12:10:09Z',
        failed: 6,
      },
    },
    {
      metadata: {
        name: 'standalone-job',
        namespace: 'jeff-project',
        selfLink: '/apis/batch/v1/namespaces/jeff-project/jobs/standalone-job',
        uid: 'c1a988ed-3fd6-4a10-a4a5-7612a28eb48e',
        resourceVersion: '59800',
        creationTimestamp: '2020-06-24T11:17:41Z',
        labels: {
          'controller-uid': 'c1a988ed-3fd6-4a10-a4a5-7612a28eb48e',
          'job-name': 'standalone-job',
        },
        managedFields: [
          {
            manager: 'oc',
            operation: 'Update',
            apiVersion: 'batch/v1',
            time: '2020-06-24T11:17:41Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:spec': {
                'f:backoffLimit': {},
                'f:completions': {},
                'f:parallelism': {},
                'f:selector': {},
                'f:template': {
                  'f:metadata': {
                    'f:name': {},
                  },
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"pi"}': {
                        '.': {},
                        'f:command': {},
                        'f:image': {},
                        'f:imagePullPolicy': {},
                        'f:name': {},
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
            manager: 'kube-controller-manager',
            operation: 'Update',
            apiVersion: 'batch/v1',
            time: '2020-06-24T11:18:42Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:status': {
                'f:completionTime': {},
                'f:conditions': {
                  '.': {},
                  'k:{"type":"Complete"}': {
                    '.': {},
                    'f:lastProbeTime': {},
                    'f:lastTransitionTime': {},
                    'f:status': {},
                    'f:type': {},
                  },
                },
                'f:startTime': {},
                'f:succeeded': {},
              },
            },
          },
        ],
      },
      spec: {
        parallelism: 1,
        completions: 1,
        backoffLimit: 6,
        selector: {
          matchLabels: {
            'controller-uid': 'c1a988ed-3fd6-4a10-a4a5-7612a28eb48e',
          },
        },
        template: {
          metadata: {
            name: 'pi',
            creationTimestamp: null,
            labels: {
              'controller-uid': 'c1a988ed-3fd6-4a10-a4a5-7612a28eb48e',
              'job-name': 'standalone-job',
            },
          },
          spec: {
            containers: [
              {
                name: 'pi',
                image: 'perl',
                command: ['perl', '-Mbignum=bpi', '-wle', 'print bpi(2000)'],
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'Always',
              },
            ],
            restartPolicy: 'Never',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        conditions: [
          {
            type: 'Complete',
            status: 'True',
            lastProbeTime: '2020-06-24T11:18:42Z',
            lastTransitionTime: '2020-06-24T11:18:42Z',
          },
        ],
        startTime: '2020-06-24T11:17:41Z',
        completionTime: '2020-06-24T11:18:42Z',
        succeeded: 1,
      },
    },
    {
      kind: 'Job',
      apiVersion: 'batch/v1',
      metadata: {
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
        },
        selfLink: '/apis/batch/v1/namespaces/jeff-project/jobs/py-cron-1593002100',
        resourceVersion: '125142',
        name: 'py-cron-1593002100',
        uid: '39d16c87-00b8-4423-a66a-ac712cda7701',
        creationTimestamp: '2020-06-24T12:35:05Z',
        managedFields: [
          {
            manager: 'kube-controller-manager',
            operation: 'Update',
            apiVersion: 'batch/v1',
            time: '2020-06-24T12:35:05Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:metadata': {
                'f:annotations': {
                  '.': {},
                  'f:alpha.image.policy.openshift.io/resolve-names': {},
                },
                'f:ownerReferences': {
                  '.': {},
                  'k:{"uid":"be644703-be4b-4ee5-9d86-fdeb9495569c"}': {
                    '.': {},
                    'f:apiVersion': {},
                    'f:blockOwnerDeletion': {},
                    'f:controller': {},
                    'f:kind': {},
                    'f:name': {},
                    'f:uid': {},
                  },
                },
              },
              'f:spec': {
                'f:backoffLimit': {},
                'f:completions': {},
                'f:parallelism': {},
                'f:template': {
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"py-cron"}': {
                        '.': {},
                        'f:env': {
                          '.': {},
                          'k:{"name":"HOST"}': {
                            '.': {},
                            'f:name': {},
                            'f:value': {},
                          },
                          'k:{"name":"NAMESPACE"}': {
                            '.': {},
                            'f:name': {},
                            'f:valueFrom': {
                              '.': {},
                              'f:fieldRef': {
                                '.': {},
                                'f:apiVersion': {},
                                'f:fieldPath': {},
                              },
                            },
                          },
                        },
                        'f:image': {},
                        'f:imagePullPolicy': {},
                        'f:name': {},
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
              'f:status': {
                'f:active': {},
                'f:startTime': {},
              },
            },
          },
        ],
        namespace: 'jeff-project',
        ownerReferences: [
          {
            apiVersion: 'batch/v1beta1',
            kind: 'CronJob',
            name: 'py-cron',
            uid: 'be644703-be4b-4ee5-9d86-fdeb9495569c',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'controller-uid': '39d16c87-00b8-4423-a66a-ac712cda7701',
          'job-name': 'py-cron-1593002100',
        },
      },
      spec: {
        parallelism: 1,
        completions: 1,
        backoffLimit: 6,
        selector: {
          matchLabels: {
            'controller-uid': '39d16c87-00b8-4423-a66a-ac712cda7701',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'controller-uid': '39d16c87-00b8-4423-a66a-ac712cda7701',
              'job-name': 'py-cron-1593002100',
            },
          },
          spec: {
            containers: [
              {
                name: 'py-cron',
                image:
                  'image-registry.openshift-image-registry.svc:5000/jeff-project/py-cron@sha256:47c25f041c18c19f65b609df38a49a095ca0358dcfd11db77a21a0380905ecac',
                env: [
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
                    name: 'HOST',
                    value: 'https://okd.host:port',
                  },
                ],
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'Always',
              },
            ],
            restartPolicy: 'Never',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        startTime: '2020-06-24T12:35:05Z',
        active: 1,
      },
    },
  ],
  loaded: true,
  loadError: '',
};

export const sampleCronJobs: FirehoseResult = {
  data: [
    {
      metadata: {
        name: 'py-cron',
        namespace: 'jeff-project',
        selfLink: '/apis/batch/v1beta1/namespaces/jeff-project/cronjobs/py-cron',
        uid: 'be644703-be4b-4ee5-9d86-fdeb9495569c',
        resourceVersion: '125137',
        creationTimestamp: '2020-06-24T11:17:41Z',
        labels: {
          app: 'py-cron',
        },
        managedFields: [
          {
            manager: 'oc',
            operation: 'Update',
            apiVersion: 'batch/v1beta1',
            time: '2020-06-24T11:17:41Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:metadata': {
                'f:labels': {
                  '.': {},
                  'f:app': {},
                },
              },
              'f:spec': {
                'f:concurrencyPolicy': {},
                'f:failedJobsHistoryLimit': {},
                'f:jobTemplate': {
                  'f:metadata': {
                    'f:annotations': {
                      '.': {},
                      'f:alpha.image.policy.openshift.io/resolve-names': {},
                    },
                  },
                  'f:spec': {
                    'f:template': {
                      'f:spec': {
                        'f:containers': {
                          'k:{"name":"py-cron"}': {
                            '.': {},
                            'f:env': {
                              '.': {},
                              'k:{"name":"HOST"}': {
                                '.': {},
                                'f:name': {},
                                'f:value': {},
                              },
                              'k:{"name":"NAMESPACE"}': {
                                '.': {},
                                'f:name': {},
                                'f:valueFrom': {
                                  '.': {},
                                  'f:fieldRef': {
                                    '.': {},
                                    'f:apiVersion': {},
                                    'f:fieldPath': {},
                                  },
                                },
                              },
                            },
                            'f:image': {},
                            'f:imagePullPolicy': {},
                            'f:name': {},
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
                'f:schedule': {},
                'f:startingDeadlineSeconds': {},
                'f:successfulJobsHistoryLimit': {},
                'f:suspend': {},
              },
            },
          },
          {
            manager: 'kube-controller-manager',
            operation: 'Update',
            apiVersion: 'batch/v1beta1',
            time: '2020-06-24T12:35:05Z',
            fieldsType: 'FieldsV1',
            fieldsV1: {
              'f:status': {
                'f:active': {},
                'f:lastScheduleTime': {},
              },
            },
          },
        ],
      },
      spec: {
        schedule: '*/5 * * * *',
        startingDeadlineSeconds: 600,
        concurrencyPolicy: 'Replace',
        suspend: false,
        jobTemplate: {
          metadata: {
            creationTimestamp: null,
            annotations: {
              'alpha.image.policy.openshift.io/resolve-names': '*',
            },
          },
          spec: {
            template: {
              metadata: {
                creationTimestamp: null,
              },
              spec: {
                containers: [
                  {
                    name: 'py-cron',
                    image: 'py-cron/py-cron:1.0',
                    env: [
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
                        name: 'HOST',
                        value: 'https://okd.host:port',
                      },
                    ],
                    resources: {},
                    terminationMessagePath: '/dev/termination-log',
                    terminationMessagePolicy: 'File',
                    imagePullPolicy: 'Always',
                  },
                ],
                restartPolicy: 'Never',
                terminationGracePeriodSeconds: 30,
                dnsPolicy: 'ClusterFirst',
                securityContext: {},
                schedulerName: 'default-scheduler',
              },
            },
          },
        },
        successfulJobsHistoryLimit: 3,
        failedJobsHistoryLimit: 1,
      },
      status: {
        active: [
          {
            kind: 'Job',
            namespace: 'jeff-project',
            name: 'py-cron-1593002100',
            uid: '39d16c87-00b8-4423-a66a-ac712cda7701',
            apiVersion: 'batch/v1',
            resourceVersion: '125136',
          },
        ],
        lastScheduleTime: '2020-06-24T12:35:00Z',
      },
    },
  ],
  loaded: true,
  loadError: '',
};

export const samplePipeline: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        creationTimestamp: '2019-10-18T10:06:37Z',
        generation: 1,
        name: 'hello-world-pipeline',
        namespace: 't-s',
        resourceVersion: '371236',
        selfLink: '/apis/tekton.dev/v1alpha1/namespaces/t-s/pipelines/hello-world-pipeline',
        uid: '73d7842d-975f-44ab-99e4-727b7cf097b6',
        labels: {
          'app.kubernetes.io/instance': 'nodejs',
        },
      },
      spec: {
        tasks: [
          {
            name: 'hello-world',
            taskRef: {
              name: 'hello-world',
            },
          },
        ],
      },
    },
  ],
};

export const samplePipelineRun: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'PipelineRun',
      metadata: {
        creationTimestamp: '2019-10-18T10:07:28Z',
        generation: 1,
        labels: {
          'tekton.dev/pipeline': 'hello-world-pipeline',
        },
        name: 'hello-world-pipeline',
        namespace: 't-s',
        resourceVersion: '371822',
        selfLink: '/apis/tekton.dev/v1alpha1/namespaces/t-s/pipelineruns/hello-world-pipeline',
        uid: 'a049c81e-ba40-4248-ac54-a2728893afcb',
      },
      spec: {
        pipelineRef: {
          name: 'hello-world-pipeline',
        },
        podTemplate: {},
        timeout: '1h0m0s',
      },
      status: {
        completionTime: '2019-10-18T10:08:00Z',
        conditions: [
          {
            lastTransitionTime: '2019-10-18T10:08:00Z',
            message: 'All Tasks have completed executing',
            reason: 'Succeeded',
            status: 'True',
            type: 'Succeeded',
          },
        ],
        startTime: '2019-10-18T10:07:28Z',
        taskRuns: {
          'hello-world-pipeline-hello-world-6mbs6': {
            pipelineTaskName: 'hello-world',
            status: {
              completionTime: '2019-10-18T10:08:00Z',
              conditions: [
                {
                  lastTransitionTime: '2019-10-18T10:08:00Z',
                  message: 'All Steps have completed executing',
                  reason: 'Succeeded',
                  status: 'True',
                  type: 'Succeeded',
                },
              ],
              podName: 'hello-world-pipeline-hello-world-6mbs6-pod-ab38ef',
              startTime: '2019-10-18T10:07:28Z',
              steps: [
                {
                  container: 'step-echo',
                  imageID:
                    'docker.io/library/ubuntu@sha256:1bbdea4846231d91cce6c7ff3907d26fca444fd6b7e3c282b90c7fe4251f9f86',
                  name: 'echo',
                  terminated: {
                    containerID:
                      'cri-o://14b1d028e46e921b5fa3445def9fbeb35403ae3332da347d62c01807717eba49',
                    exitCode: 0,
                    finishedAt: '2019-10-18T10:07:59Z',
                    reason: 'Completed',
                    startedAt: '2019-10-18T10:07:57Z',
                  },
                },
              ],
            },
          },
        },
      },
    },
  ],
};

export const sampleClusterServiceVersions: FirehoseResult = {
  data: [
    {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'ClusterServiceVersion',
      metadata: {
        annotations: {
          certified: 'false',
          repository: 'https://github.com/jaegertracing/jaeger-operator',
          support: 'Red Hat, Inc.',
          'alm-examples':
            '[\n  {\n    "apiVersion": "jaegertracing.io/v1",\n    "kind": "Jaeger",\n    "metadata": {\n      "name": "jaeger-all-in-one-inmemory"\n    }\n  },\n  {\n    "apiVersion": "jaegertracing.io/v1",\n    "kind": "Jaeger",\n    "metadata": {\n      "name": "jaeger-all-in-one-local-storage"\n    },\n    "spec": {\n      "storage": {\n        "options": {\n          "badger": {\n            "directory-key": "/badger/key",\n            "directory-value": "/badger/data",\n            "ephemeral": false\n          }\n        },\n        "type": "badger",\n        "volumeMounts": [\n          {\n            "mountPath": "/badger",\n            "name": "data"\n          }\n        ],\n        "volumes": [\n          {\n            "emptyDir": {},\n            "name": "data"\n          }\n        ]\n      }\n    }\n  },\n  {\n    "apiVersion": "jaegertracing.io/v1",\n    "kind": "Jaeger",\n    "metadata": {\n      "name": "jaeger-prod-elasticsearch"\n    },\n    "spec": {\n      "storage": {\n        "options": {\n          "es": {\n            "server-urls": "http://elasticsearch.default.svc:9200"\n          }\n        },\n        "type": "elasticsearch"\n      },\n      "strategy": "production"\n    }\n  }\n]',
          capabilities: 'Seamless Upgrades',
          'olm.operatorNamespace': 'openshift-operators',
          containerImage: 'registry.redhat.io/distributed-tracing/jaeger-rhel7-operator:1.13.1',
          createdAt: '2019-07-05T11:16:15+00:00',
          categories: 'Logging & Tracing',
          description:
            'Provides tracing, monitoring and troubleshooting microservices-based distributed systems',
          'olm.operatorGroup': 'global-operators',
        },
        selfLink:
          '/apis/operators.coreos.com/v1alpha1/namespaces/newproj/clusterserviceversions/jaeger-operator.v1.13.1',
        resourceVersion: '205414',
        name: 'jaeger-operator.v1.13.1',
        uid: '777f23e6-42fa-419d-b2ee-592c1b0001ae',
        creationTimestamp: '2019-12-13T13:54:41Z',
        generation: 1,
        namespace: 'newproj',
        labels: {
          'olm.api.c9f771e815ec55e': 'provided',
          'olm.api.e43efcaa45c9f8d0': 'required',
          'olm.copiedFrom': 'openshift-operators',
        },
      },
      spec: {
        customresourcedefinitions: {
          owned: [
            {
              description: 'A configuration file for a Jaeger custom resource.',
              displayName: 'Jaeger',
              kind: 'Jaeger',
              name: 'jaegers.jaegertracing.io',
              version: 'v1',
            },
          ],
          required: [
            {
              description: 'An Elasticsearch cluster instance',
              displayName: 'Elasticsearch',
              kind: 'Elasticsearch',
              name: 'elasticsearches.logging.openshift.io',
              version: 'v1',
            },
          ],
        },
        apiservicedefinitions: {},
        keywords: ['tracing', 'monitoring', 'troubleshooting'],
        displayName: 'Jaeger Operator',
        provider: {
          name: 'Red Hat, Inc.',
        },
        maturity: 'alpha',
        installModes: [
          {
            supported: true,
            type: 'OwnNamespace',
          },
          {
            supported: true,
            type: 'SingleNamespace',
          },
          {
            supported: true,
            type: 'MultiNamespace',
          },
          {
            supported: true,
            type: 'AllNamespaces',
          },
        ],
        version: '1.13.1',
        icon: [
          {
            base64data: '',
            mediatype: 'image/svg+xml',
          },
        ],
        links: [
          {
            name: 'Jaeger Operator Source Code',
            url: 'https://github.com/jaegertracing/jaeger-operator',
          },
        ],
        install: {
          spec: {
            clusterPermissions: [
              {
                rules: [
                  {
                    apiGroups: [''],
                    resources: [
                      'pods',
                      'services',
                      'endpoints',
                      'persistentvolumeclaims',
                      'events',
                      'configmaps',
                      'secrets',
                      'serviceaccounts',
                    ],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['apps'],
                    resources: ['deployments', 'daemonsets', 'replicasets', 'statefulsets'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['monitoring.coreos.com'],
                    resources: ['servicemonitors'],
                    verbs: ['get', 'create'],
                  },
                  {
                    apiGroups: ['io.jaegertracing'],
                    resources: ['*'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['extensions'],
                    resources: ['ingresses'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['batch'],
                    resources: ['jobs', 'cronjobs'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['route.openshift.io'],
                    resources: ['routes'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['logging.openshift.io'],
                    resources: ['elasticsearches'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['jaegertracing.io'],
                    resources: ['*'],
                    verbs: ['*'],
                  },
                ],
                serviceAccountName: 'jaeger-operator',
              },
            ],
            deployments: [
              {
                name: 'jaeger-operator',
                spec: {
                  replicas: 1,
                  selector: {
                    matchLabels: {
                      name: 'jaeger-operator',
                    },
                  },
                  strategy: {},
                  template: {
                    metadata: {
                      creationTimestamp: null,
                      labels: {
                        name: 'jaeger-operator',
                      },
                    },
                    spec: {
                      containers: [
                        {
                          args: [
                            'start',
                            '--jaeger-agent-image=registry.redhat.io/distributed-tracing/jaeger-agent-rhel7',
                            '--jaeger-query-image=registry.redhat.io/distributed-tracing/jaeger-query-rhel7',
                            '--jaeger-collector-image=registry.redhat.io/distributed-tracing/jaeger-collector-rhel7',
                            '--jaeger-ingester-image=registry.redhat.io/distributed-tracing/jaeger-ingester-rhel7',
                            '--jaeger-all-in-one-image=registry.redhat.io/distributed-tracing/jaeger-all-in-one-rhel7',
                            '--jaeger-es-index-cleaner-image=registry.redhat.io/distributed-tracing/jaeger-es-index-cleaner-rhel7',
                            '--openshift-oauth-proxy-image=registry.redhat.io/openshift4/ose-oauth-proxy:latest',
                          ],
                          env: [
                            {
                              name: 'WATCH_NAMESPACE',
                              valueFrom: {
                                fieldRef: {
                                  fieldPath: "metadata.annotations['olm.targetNamespaces']",
                                },
                              },
                            },
                            {
                              name: 'POD_NAME',
                              valueFrom: {
                                fieldRef: {
                                  fieldPath: 'metadata.name',
                                },
                              },
                            },
                            {
                              name: 'OPERATOR_NAME',
                              value: 'jaeger-operator',
                            },
                          ],
                          image:
                            'registry.redhat.io/distributed-tracing/jaeger-rhel7-operator:1.13.1',
                          imagePullPolicy: 'Always',
                          name: 'jaeger-operator',
                          ports: [
                            {
                              containerPort: 8383,
                              name: 'metrics',
                            },
                          ],
                          resources: {},
                        },
                      ],
                      serviceAccountName: 'jaeger-operator',
                    },
                  },
                },
              },
            ],
            permissions: [
              {
                rules: [
                  {
                    apiGroups: [''],
                    resources: [
                      'pods',
                      'services',
                      'endpoints',
                      'persistentvolumeclaims',
                      'events',
                      'configmaps',
                      'secrets',
                      'serviceaccounts',
                    ],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['apps'],
                    resources: ['deployments', 'daemonsets', 'replicasets', 'statefulsets'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['monitoring.coreos.com'],
                    resources: ['servicemonitors'],
                    verbs: ['get', 'create'],
                  },
                  {
                    apiGroups: ['io.jaegertracing'],
                    resources: ['*'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['extensions'],
                    resources: ['ingresses'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['batch'],
                    resources: ['jobs', 'cronjobs'],
                    verbs: ['*'],
                  },
                  {
                    apiGroups: ['rbac.authorization.k8s.io'],
                    resources: ['clusterrolebindings'],
                    verbs: ['*'],
                  },
                ],
                serviceAccountName: 'jaeger-operator',
              },
            ],
          },
          strategy: 'deployment',
        },
        maintainers: [
          {
            email: 'jaeger-tracing@googlegroups.com',
            name: 'Jaeger Google Group',
          },
        ],
        description:
          'Jaeger, inspired by [Dapper](https://research.google.com/pubs/pub36356.html) and [OpenZipkin](http://zipkin.io/), is a distributed tracing system released as open source by Uber Technologies. It is used for monitoring and troubleshooting microservices-based distributed systems.\n\n### Core capabilities\n\nJaeger is used for monitoring and troubleshooting microservices-based distributed systems, including:\n\n* Distributed context propagation\n* Distributed transaction monitoring\n* Root cause analysis\n* Service dependency analysis\n* Performance / latency optimization\n* OpenTracing compatible data model\n* Multiple storage backends: Elasticsearch, Memory.\n\n### Operator features\n\n* **Multiple modes** - Supports `allInOne` and `production`[modes of deployment](https://www.jaegertracing.io/docs/latest/operator/#deployment-strategies).\n\n* **Configuration** - The Operator manages [configuration information](https://www.jaegertracing.io/docs/latest/operator/#configuring-the-custom-resource) when installing Jaeger instances.\n\n* **Storage** - [Configure storage](https://www.jaegertracing.io/docs/latest/operator/#storage-options) used by Jaeger. By default, `memory` is used. Other options include `elasticsearch`. The operator can delegate creation of an Elasticsearch cluster to the Elasticsearch Operator if deployed.\n\n* **Agent** - can be deployed as [sidecar](https://www.jaegertracing.io/docs/latest/operator/#auto-injecting-jaeger-agent-sidecars) (default) and/or [daemonset](https://www.jaegertracing.io/docs/latest/operator/#installing-the-agent-as-daemonset).\n\n* **UI** - Optionally setup secure route to provide [access to the Jaeger UI](https://www.jaegertracing.io/docs/latest/operator/#accessing-the-jaeger-console-ui).\n\n### Before you start\n\n1. Ensure that the appropriate storage solution, that will be used by the Jaeger instance, is available and configured.\n2. If intending to deploy an Elasticsearch cluster via the Jaeger custom resource, then the Elasticsearch Operator must first be installed.\n\n### Troubleshooting\n\n* https://www.jaegertracing.io/docs/latest/troubleshooting/',
        selector: {
          matchLabels: {
            name: 'jaeger-operator',
          },
        },
        labels: {
          name: 'jaeger-operator',
        },
      },
      status: {
        reason: 'Copied',
        message: 'The operator is running in openshift-operators but is managing this namespace',
        lastUpdateTime: '2019-12-13T14:25:20Z',
        requirementStatus: [
          {
            group: 'apiextensions.k8s.io',
            kind: 'CustomResourceDefinition',
            message: 'CRD is present and Established condition is true',
            name: 'elasticsearches.logging.openshift.io',
            status: 'Present',
            uuid: '58fe3dc1-0670-48f6-8382-27aadcb7eadb',
            version: 'v1beta1',
          },
          {
            group: 'apiextensions.k8s.io',
            kind: 'CustomResourceDefinition',
            message: 'CRD is present and Established condition is true',
            name: 'jaegers.jaegertracing.io',
            status: 'Present',
            uuid: 'f68d706b-7807-453f-91bf-ead0e2fcefcb',
            version: 'v1beta1',
          },
          {
            dependents: [
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'namespaced rule:{"verbs":["*"],"apiGroups":[""],"resources":["pods","services","endpoints","persistentvolumeclaims","events","configmaps","secrets","serviceaccounts"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'namespaced rule:{"verbs":["*"],"apiGroups":["apps"],"resources":["deployments","daemonsets","replicasets","statefulsets"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'namespaced rule:{"verbs":["get","create"],"apiGroups":["monitoring.coreos.com"],"resources":["servicemonitors"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'namespaced rule:{"verbs":["*"],"apiGroups":["io.jaegertracing"],"resources":["*"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'namespaced rule:{"verbs":["*"],"apiGroups":["extensions"],"resources":["ingresses"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'namespaced rule:{"verbs":["*"],"apiGroups":["batch"],"resources":["jobs","cronjobs"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'namespaced rule:{"verbs":["*"],"apiGroups":["rbac.authorization.k8s.io"],"resources":["clusterrolebindings"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":[""],"resources":["pods","services","endpoints","persistentvolumeclaims","events","configmaps","secrets","serviceaccounts"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":["apps"],"resources":["deployments","daemonsets","replicasets","statefulsets"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["get","create"],"apiGroups":["monitoring.coreos.com"],"resources":["servicemonitors"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":["io.jaegertracing"],"resources":["*"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":["extensions"],"resources":["ingresses"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":["batch"],"resources":["jobs","cronjobs"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":["route.openshift.io"],"resources":["routes"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":["logging.openshift.io"],"resources":["elasticsearches"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
              {
                group: 'rbac.authorization.k8s.io',
                kind: 'PolicyRule',
                message:
                  'cluster rule:{"verbs":["*"],"apiGroups":["jaegertracing.io"],"resources":["*"]}',
                status: 'Satisfied',
                version: 'v1beta1',
              },
            ],
            group: '',
            kind: 'ServiceAccount',
            message: '',
            name: 'jaeger-operator',
            status: 'Present',
            version: 'v1',
          },
        ],
        certsLastUpdated: null,
        lastTransitionTime: '2019-12-13T13:54:47Z',
        conditions: [
          {
            lastTransitionTime: '2019-12-13T13:54:15Z',
            lastUpdateTime: '2019-12-13T13:54:15Z',
            message: 'requirements not yet checked',
            phase: 'Pending',
            reason: 'RequirementsUnknown',
          },
          {
            lastTransitionTime: '2019-12-13T13:54:20Z',
            lastUpdateTime: '2019-12-13T13:54:20Z',
            message: 'all requirements found, attempting install',
            phase: 'InstallReady',
            reason: 'AllRequirementsMet',
          },
          {
            lastTransitionTime: '2019-12-13T13:54:22Z',
            lastUpdateTime: '2019-12-13T13:54:22Z',
            message: 'waiting for install components to report healthy',
            phase: 'Installing',
            reason: 'InstallSucceeded',
          },
          {
            lastTransitionTime: '2019-12-13T13:54:22Z',
            lastUpdateTime: '2019-12-13T13:54:23Z',
            message:
              'installing: Waiting: waiting for deployment jaeger-operator to become ready: Waiting for rollout to finish: 0 of 1 updated replicas are available...\n',
            phase: 'Installing',
            reason: 'InstallWaiting',
          },
          {
            lastTransitionTime: '2019-12-13T13:54:47Z',
            lastUpdateTime: '2019-12-13T13:54:47Z',
            message: 'install strategy completed with no errors',
            phase: 'Succeeded',
            reason: 'InstallSucceeded',
          },
        ],
        phase: 'Succeeded',
        certsRotateAt: null,
      },
    },
  ],
  loadError: '',
  loaded: true,
};

export const topologyDataModel: Model = {
  nodes: [
    {
      id: 'e187afa2-53b1-406d-a619-cf9ff1468031',
      type: 'workload',
      label: 'hello-openshift',
      data: {
        data: {},
        id: 'e187afa2-53b1-406d-a619-cf9ff1468031',
        name: 'hello-openshift',
        type: 'workload',
        resources: {
          buildConfigs: [],
          obj: sampleDeployments.data[0],
          routes: [],
          services: [],
        },
      },
      ...WorkloadModelProps,
    },
    {
      id: 'e187afa2-53b1-406d-a619-cf9ff1468032',
      type: 'workload',
      label: 'hello-openshift-1',
      data: {
        data: {},
        id: 'e187afa2-53b1-406d-a619-cf9ff1468032',
        name: 'hello-openshift-1',
        type: 'workload',
        resources: {
          buildConfigs: [],
          obj: sampleDeployments.data[1],
          routes: [],
          services: [],
        },
      },
      ...WorkloadModelProps,
    },
  ],
  edges: [],
};

export const dataModel: Model = {
  nodes: [
    {
      data: topologyDataModel.nodes[0].data,
      id: 'e187afa2-53b1-406d-a619-cf9ff1468031',
      label: 'hello-openshift',
      type: 'workload',
      visible: true,
      group: false,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      style: {
        padding: NODE_PADDING,
      },
    },
    {
      data: topologyDataModel.nodes[1].data,
      id: 'e187afa2-53b1-406d-a619-cf9ff1468032',
      label: 'hello-openshift-1',
      type: 'workload',
      visible: true,
      group: false,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      style: {
        padding: NODE_PADDING,
      },
    },
  ],
  edges: [],
};

export const sampleHelmChartDeploymentConfig = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'nodejs-helm',
    namespace: 'testproject1',
    selfLink: '/apis/apps.openshift.io/v1/namespaces/testproject1/deploymentconfigs/nodejs',
    uid: 'b69ey0df-3f9382-11e9-02f68-525400680f2',
    resourceVersion: '732186',
    generation: 2,
    creationTimestamp: '2019-04-22T11:58:33Z',
    labels: {
      app: 'nodejs-helm',
      heritage: 'Helm',
      chart: 'Nodejs',
      release: 'nodejs-helm-12345',
    },
    annotations: {
      'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
      'app.openshift.io/vcs-ref': 'master',
    },
  },
  spec: {
    strategy: {
      type: 'Rolling',
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          app: 'nodejs-helm',
          deploymentconfig: 'nodejs-helm',
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
};

export const sampleHelmResourcesMap = {
  'DeploymentConfig---nodejs-helm': {
    releaseName: 'nodejs-helm',
    releaseVersion: 1,
    chartIcon: '',
    manifestResources: [sampleHelmChartDeploymentConfig],
    releaseNotes: 'test release notes',
  },
};

export const sampleEventsResource: FirehoseResult<EventKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'v1',
      kind: 'Event',
      type: 'Normal',
      lastTimestamp: '2020-01-23T10:00:47Z',
      reason: 'Started',
      firstTimestamp: '2020-01-23T08:21:06Z',
      involvedObject: {
        kind: 'Pod',
        namespace: 'testproject3',
        name: 'analytics-deployment-59dd7c47d4-2jp7t',
        uid: 'f5ee90e4-959f-47df-b305-56a78cb047ea',
      },
      source: {
        component: 'kubelet',
        host: 'ip-10-0-130-190.us-east-2.compute.internal',
      },
    },
  ],
};

export const MockResources: TopologyDataResources = {
  deployments: sampleDeployments,
  deploymentConfigs: sampleDeploymentConfigs,
  replicationControllers: sampleReplicationControllers,
  replicaSets: sampleReplicaSets,
  pods: samplePods,
  jobs: sampleJobs,
  cronJobs: sampleCronJobs,
  services: sampleServices,
  routes: sampleRoutes,
  buildConfigs: sampleBuildConfigs,
  builds: sampleBuilds,
  daemonSets: sampleDaemonSets,
  statefulSets: sampleStatefulSets,
  pipelines: samplePipeline,
  pipelineRuns: samplePipelineRun,
  clusterServiceVersions: sampleClusterServiceVersions,
  events: sampleEventsResource as FirehoseResult<any>,
};

export const MockBaseResources: TopologyDataResources = {
  deployments: sampleDeployments,
  deploymentConfigs: sampleDeploymentConfigs,
  replicationControllers: sampleReplicationControllers,
  replicaSets: sampleReplicaSets,
  pods: samplePods,
  jobs: sampleJobs,
  cronJobs: sampleCronJobs,
  services: sampleServices,
  routes: sampleRoutes,
  buildConfigs: sampleBuildConfigs,
  builds: sampleBuilds,
  daemonSets: sampleDaemonSets,
  statefulSets: sampleStatefulSets,
};

export const MockKialiGraphData = {
  nodes: [
    {
      data: {
        id: '5cd385c1ee3309ae40828b5702ae57fb',
        nodeType: 'workload',
        namespace: 'testproject1',
        workload: 'wit-deployment',
        app: 'details',
        version: 'v1',
        destServices: [
          {
            namespace: 'bookinfo',
            name: 'details',
          },
        ],
        traffic: [
          {
            protocol: 'http',
            rates: {
              httpIn: '0.04',
            },
          },
        ],
      },
    },
    {
      data: {
        id: '240c2314cefc993c5d9479a5c349fbd2',
        nodeType: 'workload',
        namespace: 'testproject1',
        workload: 'analytics-deployment',
        app: 'productpage',
        version: 'v1',
        destServices: [
          {
            namespace: 'bookinfo',
            name: 'productpage',
          },
        ],
        traffic: [
          {
            protocol: 'http',
            rates: {
              httpIn: '0.04',
              httpOut: '0.08',
            },
          },
        ],
      },
    },
  ],
  edges: [
    {
      data: {
        id: 'df66cffc756bf9983dd453837e4e14a7',
        source: '240c2314cefc993c5d9479a5c349fbd2',
        target: '5cd385c1ee3309ae40828b5702ae57fb',
        traffic: {
          protocol: 'http',
          rates: {
            http: '0.04',
            httpPercentReq: '50.6',
          },
          responses: {
            '200': {
              '-': '100.0',
            },
          },
        },
      },
    },
  ],
};
