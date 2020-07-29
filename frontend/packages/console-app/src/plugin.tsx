import * as React from 'react';
import * as _ from 'lodash';
import { CogsIcon } from '@patternfly/react-icons';
import { FLAGS } from '@console/shared/src/constants';
import { FLAG_DEVWORKSPACE } from './consts';
import {
  Plugin,
  Perspective,
  ModelFeatureFlag,
  ModelDefinition,
  RoutePage,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewHealthOperator,
  ReduxReducer,
  ResourceDetailsPage,
  ResourceListPage,
  ResourceClusterNavItem,
  ResourceTabPage,
  ContextProvider,
} from '@console/plugin-sdk';
import {
  ClusterVersionModel,
  NodeModel,
  PodModel,
  StorageClassModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotContentModel,
  ClusterOperatorModel,
} from '@console/internal/models';
import { referenceForModel, ClusterOperator } from '@console/internal/module/k8s';
import {
  getNodeStatusGroups,
  getPodStatusGroups,
  getPVCStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/utils';
import {
  fetchK8sHealth,
  getK8sHealthState,
  getControlPlaneHealth,
  getClusterOperatorHealthStatus,
} from './components/dashboards-page/status';
import {
  API_SERVERS_UP,
  API_SERVER_REQUESTS_SUCCESS,
  CONTROLLER_MANAGERS_UP,
  SCHEDULERS_UP,
} from './queries';
import {
  getClusterUpdateTimestamp,
  isClusterUpdateActivity,
} from './components/dashboards-page/activity';
import reducer from './redux/reducer';
import * as models from './models';
import { TourContext, useTourValuesForContext } from './components/tour/tour-context';

type ConsumedExtensions =
  | Perspective
  | ModelDefinition
  | ModelFeatureFlag
  | RoutePage
  | DashboardsOverviewResourceActivity
  | DashboardsOverviewHealthURLSubsystem<any>
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewInventoryItem
  | DashboardsOverviewHealthOperator<ClusterOperator>
  | ReduxReducer
  | ResourceListPage
  | ResourceDetailsPage
  | ResourceClusterNavItem
  | ResourceTabPage
  | ContextProvider;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.WorkspaceModel,
      flag: FLAG_DEVWORKSPACE,
    },
  },
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: <CogsIcon />,
      default: true,
      getLandingPageURL: (flags) =>
        flags[FLAGS.CAN_LIST_NS] ? '/dashboards' : '/k8s/cluster/projects',
      getK8sLandingPageURL: () => '/search',
      getImportRedirectURL: (project) => `/k8s/cluster/projects/${project}/workloads`,
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        prop: 'clusterVersion',
        kind: referenceForModel(ClusterVersionModel),
        namespaced: false,
      },
      isActivity: isClusterUpdateActivity,
      getTimestamp: getClusterUpdateTimestamp,
      loader: () =>
        import(
          './components/dashboards-page/ClusterUpdateActivity' /* webpackChunkName: "console-app" */
        ).then((m) => m.default),
    },
    flags: {
      required: [FLAGS.CLUSTER_VERSION],
    },
  },
  {
    type: 'Dashboards/Overview/Health/URL',
    properties: {
      title: 'Cluster',
      url: 'healthz',
      fetch: fetchK8sHealth,
      healthHandler: getK8sHealthState,
      additionalResource: {
        kind: referenceForModel(ClusterVersionModel),
        namespaced: false,
        name: 'version',
        isList: false,
        prop: 'cv',
        optional: true,
      },
    },
  },
  {
    type: 'Dashboards/Overview/Health/Prometheus',
    properties: {
      title: 'Control Plane',
      queries: [API_SERVERS_UP, CONTROLLER_MANAGERS_UP, SCHEDULERS_UP, API_SERVER_REQUESTS_SUCCESS],
      healthHandler: getControlPlaneHealth,
      popupComponent: () =>
        import(
          './components/dashboards-page/ControlPlaneStatus' /* webpackChunkName: "console-app" */
        ).then((m) => m.default),
      popupTitle: 'Control Plane status',
      disallowedProviders: ['IBMCloud'],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: NodeModel,
      mapper: getNodeStatusGroups,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: PodModel,
      mapper: getPodStatusGroups,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: StorageClassModel,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: PersistentVolumeClaimModel,
      mapper: getPVCStatusGroups,
      useAbbr: true,
    },
  },
  {
    type: 'Dashboards/Overview/Health/Operator',
    properties: {
      title: 'Cluster operators',
      resources: [
        {
          kind: referenceForModel(ClusterOperatorModel),
          isList: true,
          namespaced: false,
          prop: 'clusterOperators',
        },
      ],
      getOperatorsWithStatuses: getClusterOperatorHealthStatus,
      operatorRowLoader: () =>
        import(
          './components/dashboards-page/OperatorStatus' /* webpackChunkName: "console-app" */
        ).then((c) => c.default),
      viewAllLink: '/settings/cluster/clusteroperators',
    },
    flags: {
      required: [FLAGS.CLUSTER_VERSION],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/quickstart/'],
      loader: async () =>
        (
          await import(
            './components/quick-starts/QuickStartsPage' /* webpackChunkName: "co-quick-start" */
          )
        ).default,
    },
  },
  {
    type: 'ReduxReducer',
    properties: {
      namespace: 'console',
      reducer,
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      section: 'Storage',
      componentProps: {
        name: 'Volume Snapshot Contents',
        resource: referenceForModel(VolumeSnapshotContentModel),
      },
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: VolumeSnapshotContentModel,
      loader: () =>
        import(
          './components/volume-snapshot/volume-snapshot-content' /* webpackChunkName: "volume-snapshot-content-page" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: VolumeSnapshotContentModel,
      loader: () =>
        import(
          './components/volume-snapshot/volume-snapshot-content-details' /* webpackChunkName: "volume-snapshot-content-details-page" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'volumesnapshots',
      model: PersistentVolumeClaimModel,
      name: 'Volume Snapshots',
      loader: () =>
        import(
          './components/volume-snapshot/volume-snapshot' /* webpackChunkName: "volume-snapshot-page" */
        ).then((m) => m.VolumeSnapshotPVCPage),
    },
  },
  {
    type: 'ContextProvider',
    properties: {
      Provider: TourContext.Provider,
      useValueHook: useTourValuesForContext,
    },
  },
];

export default plugin;
