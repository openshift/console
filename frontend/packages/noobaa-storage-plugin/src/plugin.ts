import * as _ from 'lodash';
import {
  DashboardsCard,
  DashboardsTab,
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
} from '@console/plugin-sdk';
import { GridPosition } from '@console/internal/components/dashboard/grid';
import * as models from './models';

type ConsumedExtensions = ModelFeatureFlag | ModelDefinition | DashboardsTab | DashboardsCard;

const NOOBAA_FLAG = 'NOOBAA';

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
      model: models.NooBaaSystemModel,
      flag: NOOBAA_FLAG,
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'object-service',
      title: 'Object Service',
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/details-card/details-card' /* webpackChunkName: "object-service-details-card" */
        ).then((m) => m.DetailsCard),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/buckets-card/buckets-card' /* webpackChunkName: "object-service-buckets-card" */
        ).then((m) => m.BucketsCard),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/resource-providers-card/resource-providers-card' /* webpackChunkName: "object-service-resource-providers-card" */
        ).then((m) => m.ResourceProvidersCard),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/data-resiliency-card/data-resiliency-card' /* webpackChunkName: "object-service-data-resiliency-card" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/object-data-reduction-card/object-data-reduction-card' /* webpackChunkName: "object-service-data-reduction-card" */
        ).then((m) => m.default),
    },
  },
];

export default plugin;
