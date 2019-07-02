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
          './components/dashboard-page/storage-dashboard/data-resiliency/data-resiliency' /* webpackChunkName: "ceph-data-resiliency-card" */
        ).then((m) => m.DataResiliencyWithResources),
    },
  },
];

export default plugin;
