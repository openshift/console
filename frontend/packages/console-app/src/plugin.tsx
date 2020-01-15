import * as React from 'react';
import { CogsIcon } from '@patternfly/react-icons';
import { FLAGS } from '@console/shared/src/constants';
import {
  Plugin,
  Perspective,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewInventoryItem,
} from '@console/plugin-sdk';
import {
  ClusterVersionModel,
  NodeModel,
  PodModel,
  StorageClassModel,
  PersistentVolumeClaimModel,
} from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  getNodeStatusGroups,
  getPodStatusGroups,
  getPVCStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/utils';
import {
  isClusterUpdateActivity,
  getClusterUpdateTimestamp,
} from './components/dashboards-page/ClusterUpdateActivity';
import {
  fetchK8sHealth,
  getK8sHealthState,
  getControlPlaneHealth,
} from './components/dashboards-page/status';
import {
  API_SERVERS_UP,
  API_SERVER_REQUESTS_SUCCESS,
  CONTROLLER_MANAGERS_UP,
  SCHEDULERS_UP,
} from './queries';

type ConsumedExtensions =
  | Perspective
  | DashboardsOverviewResourceActivity
  | DashboardsOverviewHealthURLSubsystem<any>
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewInventoryItem;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: <CogsIcon />,
      getLandingPageURL: (flags) =>
        flags[FLAGS.CAN_LIST_NS] ? '/dashboards' : '/k8s/cluster/projects',
      getK8sLandingPageURL: () => '/search',
      default: true,
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
      required: FLAGS.CLUSTER_VERSION,
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
];

export default plugin;
