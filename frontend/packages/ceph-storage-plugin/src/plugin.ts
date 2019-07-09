import * as _ from 'lodash';

import {
  DashboardsCard,
  DashboardsTab,
  ModelFeatureFlag,
  ModelDefinition,
  Plugin,
  RoutePage,
} from '@console/plugin-sdk';

import { GridPosition } from '@console/internal/components/dashboard';
import { ClusterServiceVersionModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';

type ConsumedExtensions =
  | ModelFeatureFlag
  | ModelDefinition
  | DashboardsTab
  | DashboardsCard
  | RoutePage;

const CEPH_FLAG = 'CEPH';
// keeping this for testing, will be removed once ocs operator available
const apiObjectRef = 'core.libopenstorage.org~v1alpha1~StorageCluster';
// const apiObjectRef = referenceForModel(models.OCSServiceModel);

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
      model: models.CephClusterModel,
      flag: CEPH_FLAG,
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'persistent-storage',
      title: 'Persistent Storage',
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/data-resiliency/data-resiliency' /* webpackChunkName: "ceph-data-resiliency-card" */
        ).then((m) => m.DataResiliencyWithResources),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${apiObjectRef}/~new`,
      loader: () =>
        import(
          './components/ocs-install/ocs-install' /* webpackChunkName: "ceph-ocs-service" */
        ).then((m) => m.CreateOCSService),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/capacity-card/capacity-card' /* webpackChunkName: "ceph-storage-capacity-card" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/utilization-card/utilization-card' /* webpackChunkName: "ceph-storage-utilization-card" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/events-card' /* webpackChunkName: "ceph-storage-events-card" */
        ).then((m) => m.default),
    },
  },
];

export default plugin;
