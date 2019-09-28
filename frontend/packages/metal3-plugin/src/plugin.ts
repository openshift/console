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
import { FLAGS } from '@console/internal/const';
import { BareMetalHostModel, NodeMaintenanceModel } from './models';
import { getBMHStatusGroups } from './components/baremetal-hosts/dashboard/utils';

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
      models: [BareMetalHostModel, NodeMaintenanceModel],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: BareMetalHostModel,
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
        resource: referenceForModel(BareMetalHostModel),
        required: [FLAGS.BAREMETAL, METAL3_FLAG],
      },
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: BareMetalHostModel,
      loader: async () =>
        (await import(
          './components/baremetal-hosts/BareMetalHostsPage' /* webpackChunkName: "metal3-baremetalhosts" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: BareMetalHostModel,
      loader: async () =>
        (await import(
          './components/baremetal-hosts/BareMetalHostDetailPage' /* webpackChunkName: "metal3-baremetalhost" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(BareMetalHostModel)}/~new/form`,
      loader: async () =>
        (await import(
          './components/baremetal-hosts/AddHost' /* webpackChunkName: "metal3-baremetalhost" */
        )).default,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      resource: {
        isList: true,
        kind: referenceForModel(BareMetalHostModel),
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
      model: BareMetalHostModel,
      mapper: getBMHStatusGroups,
      required: [FLAGS.BAREMETAL, METAL3_FLAG],
    },
  },
];

export default plugin;
