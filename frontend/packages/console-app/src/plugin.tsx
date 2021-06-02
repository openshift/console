import * as React from 'react';
import { CogsIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
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
  Plugin,
  Perspective,
  ModelDefinition,
  RoutePage,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewHealthOperator,
  ResourceDetailsPage,
  ResourceListPage,
  ResourceTabPage,
} from '@console/plugin-sdk';
import { FLAGS } from '@console/shared/src/constants';
import '@console/internal/i18n.js';
import {
  getClusterUpdateTimestamp,
  isClusterUpdateActivity,
} from './components/dashboards-page/activity';
import {
  fetchK8sHealth,
  getK8sHealthState,
  getControlPlaneHealth,
  getClusterOperatorHealthStatus,
} from './components/dashboards-page/status';
import * as models from './models';
import {
  API_SERVERS_UP,
  API_SERVER_REQUESTS_SUCCESS,
  CONTROLLER_MANAGERS_UP,
  SCHEDULERS_UP,
} from './queries';

type ConsumedExtensions =
  | Perspective
  | ModelDefinition
  | RoutePage
  | DashboardsOverviewResourceActivity
  | DashboardsOverviewHealthURLSubsystem<any>
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewInventoryItem
  | DashboardsOverviewHealthOperator<ClusterOperator>
  | ResourceListPage
  | ResourceDetailsPage
  | ResourceTabPage;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      // t('console-app~Administrator')
      name: '%console-app~Administrator%',
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
      // t('console-app~Cluster')
      title: '%console-app~Cluster%',
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
      // t('console-app~Control Plane')
      title: '%console-app~Control Plane%',
      queries: [API_SERVERS_UP, CONTROLLER_MANAGERS_UP, SCHEDULERS_UP, API_SERVER_REQUESTS_SUCCESS],
      healthHandler: getControlPlaneHealth,
      popupComponent: () =>
        import(
          './components/dashboards-page/ControlPlaneStatus' /* webpackChunkName: "console-app" */
        ).then((m) => m.default),
      // t('console-app~Control Plane status')
      popupTitle: '%console-app~Control Plane status%',
      disallowedProviders: ['IBMCloud'],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: NodeModel,
      mapper: () =>
        import(
          '@console/shared/src/components/dashboard/inventory-card/utils' /* webpackChunkName: "console-app" */
        ).then((m) => m.getNodeStatusGroups),
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: PodModel,
      mapper: () =>
        import(
          '@console/shared/src/components/dashboard/inventory-card/utils' /* webpackChunkName: "console-app" */
        ).then((m) => m.getPodStatusGroups),
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
      mapper: () =>
        import(
          '@console/shared/src/components/dashboard/inventory-card/utils' /* webpackChunkName: "console-app" */
        ).then((m) => m.getPVCStatusGroups),
    },
  },
  {
    type: 'Dashboards/Overview/Health/Operator',
    properties: {
      // t('console-app~Cluster operators')
      title: '%console-app~Cluster operators%',
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
            './components/quick-starts/QuickStartCatalogPage' /* webpackChunkName: "co-quick-start" */
          )
        ).default,
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
    flags: {
      required: [FLAGS.CAN_LIST_VSC],
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
    flags: {
      required: [FLAGS.CAN_LIST_VSC],
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'volumesnapshots',
      model: PersistentVolumeClaimModel,
      // t('console-app~VolumeSnapshots')
      name: '%console-app~VolumeSnapshots%',
      loader: () =>
        import(
          './components/volume-snapshot/volume-snapshot' /* webpackChunkName: "volume-snapshot-page" */
        ).then((m) => m.VolumeSnapshotPVCPage),
    },
  },
];

export default plugin;
