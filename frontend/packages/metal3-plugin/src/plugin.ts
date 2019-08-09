import {
  DashboardsOverviewInventoryItem,
  Plugin,
  ResourceNSNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  ModelFeatureFlag,
  ModelDefinition,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { MachineModel, NodeModel } from '@console/internal/models';
import { BaremetalHostModel, NodeMaintenanceModel } from './models';
import { getBMHStatusGroups } from './components/dashboard/utils';

type ConsumedExtensions =
  | DashboardsOverviewInventoryItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
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
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(BaremetalHostModel)}/~new/form`,
      loader: async () =>
        (await import('./components/add-host' /* webpackChunkName: "metal3-baremetalhost" */))
          .default,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      resource: {
        isList: true,
        kind: referenceForModel(BaremetalHostModel),
        prop: 'hosts',
      },
      additionalResources: [
        {
          isList: true,
          kind: referenceForModel(MachineModel),
          prop: 'machines',
        },
        {
          isList: true,
          kind: NodeModel.kind,
          prop: 'nodes',
        },
        {
          isList: true,
          kind: referenceForModel(NodeMaintenanceModel),
          prop: 'maintenaces',
        },
      ],
      model: BaremetalHostModel,
      mapper: getBMHStatusGroups,
    },
  },
];

export default plugin;
