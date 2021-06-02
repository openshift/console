import { Model } from '@patternfly/react-topology';
import { FirehoseResult } from '@console/internal/components/utils';
import { EventKind } from '@console/internal/module/k8s';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import { NODE_HEIGHT, NODE_PADDING, NODE_WIDTH } from '../const';
import { WorkloadModelProps } from '../data-transforms/transform-utils';
import { OdcNodeModel, TopologyDataResources } from '../topology-types';

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
  serviceBindingRequests: 'operators.coreos.com~v1alpha1~ServiceBinding',
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
  events: { loaded: true, loadError: '', data: [] },
};

export const topologyData: Model = {
  nodes: [],
  edges: [],
};

const topologyDataModelNodes: OdcNodeModel[] = [
  {
    id: 'e187afa2-53b1-406d-a619-cf9ff1468031',
    type: 'workload',
    label: 'hello-openshift',
    resource: sampleDeployments.data[0],
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
    resource: sampleDeployments.data[1],
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
];

export const topologyDataModel: Model = {
  nodes: topologyDataModelNodes,
  edges: [],
};

const dataModelNodes: OdcNodeModel[] = [
  {
    data: topologyDataModel.nodes[0].data,
    resource: topologyDataModelNodes[0].resource,
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
    resource: topologyDataModelNodes[1].resource,
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
];

export const dataModel: Model = {
  nodes: dataModelNodes,
  edges: [],
};

export const sampleHelmChartDeploymentConfig = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'nodejs-helm',
    namespace: 'testproject1',
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
