import {
  Plugin,
  ResourceNSNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  ModelFeatureFlag,
  ModelDefinition,
} from '@console/plugin-sdk';
import { BaremetalHostModel } from './models';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | ModelFeatureFlag
  | ModelDefinition;

const METAL3_FLAG = 'METAL3';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: [BaremetalHostModel],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: BaremetalHostModel,
      flag: METAL3_FLAG,
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Compute',
      mergeAfter: 'Machine Autoscalers',
      componentProps: {
        name: 'Bare Metal Hosts',
        resource: 'baremetalhosts',
        required: METAL3_FLAG,
      },
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: BaremetalHostModel,
      loader: () =>
        import('./components/host' /* webpackChunkName: "metal3-baremetalhost" */).then(
          (m) => m.BaremetalHostsPageConnected,
        ),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: BaremetalHostModel,
      loader: () =>
        import('./components/host-detail' /* webpackChunkName: "metal3-baremetalhost" */).then(
          (m) => m.BaremetalHostDetailPageConnected,
        ),
    },
  },
];

export default plugin;
