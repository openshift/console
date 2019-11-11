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
      mergeAfter: 'Machine Health Checks',
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
      loader: () =>
        import(
          './components/baremetal-hosts/BareMetalHostsPage' /* webpackChunkName: "metal3-baremetalhosts" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: BareMetalHostModel,
      loader: () =>
        import(
          './components/baremetal-hosts/BareMetalHostDetailsPage' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(BareMetalHostModel)}/~new/form`,
      loader: () =>
        import(
          './components/baremetal-hosts/add-baremetal-host/AddBareMetalHostPage' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.default),
      required: [FLAGS.BAREMETAL, METAL3_FLAG],
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
          optional: true,
        },
      ],
      model: BareMetalHostModel,
      mapper: getBMHStatusGroups,
      required: [FLAGS.BAREMETAL, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/cluster/nodes/'],
      loader: () =>
        import(
          './components/baremetal-nodes/BareMetalNodesPage' /* webpackChunkName: "node" */
        ).then((m) => m.default),
      required: [FLAGS.BAREMETAL, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/cluster/nodes/:name'],
      loader: () =>
        import(
          './components/baremetal-nodes/BareMetalNodeDetailsPage' /* webpackChunkName: "node" */
        ).then((m) => m.default),
      required: [FLAGS.BAREMETAL, METAL3_FLAG],
    },
  },
];

export default plugin;
