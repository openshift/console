import * as _ from 'lodash';

import {
  DashboardsCard,
  DashboardsTab,
  ModelFeatureFlag,
  ModelDefinition,
  Plugin,
} from '@console/plugin-sdk';

import { GridPosition } from '@console/internal/components/dashboard';
import * as models from './models';

type ConsumedExtensions = ModelFeatureFlag | ModelDefinition | DashboardsTab | DashboardsCard;

const CEPH_FLAG = 'CEPH';

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
          './components/dashboard-page/storage-dashboard/health-card' /* webpackChunkName: "ceph-storage-health-card" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/details-card' /* webpackChunkName: "ceph-storage-details-card" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/data-resiliency/data-resiliency' /* webpackChunkName: "ceph-storage-data-resiliency-card" */
        ).then((m) => m.DataResiliencyWithResources),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboard-page/storage-dashboard/events-card' /* webpackChunkName: "ceph-events-card" */
        ).then((m) => m.default),
    },
  },
];

export default plugin;
