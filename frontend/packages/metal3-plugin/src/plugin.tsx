import * as _ from 'lodash';
import * as React from 'react';
import { MaintenanceIcon } from '@patternfly/react-icons';
import {
  DashboardsOverviewInventoryItem,
  Plugin,
  HrefNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  ModelFeatureFlag,
  ModelDefinition,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewInventoryItemReplacement,
  DashboardsInventoryItemGroup,
  CustomFeatureFlag,
  ResourceTabPage,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { MachineModel, NodeModel } from '@console/internal/models';
// TODO(jtomasek): change this to '@console/shared/src/utils' once @console/shared/src/utils modules
// no longer import from @console/internal (cyclic deps issues)
import { formatNamespacedRouteForResource } from '@console/shared/src/utils/namespace';
import { BareMetalHostModel, NodeMaintenanceModel } from './models';
import { getBMHStatusGroups } from './components/baremetal-hosts/dashboard/utils';
import { getBMNStatusGroups } from './components/baremetal-nodes/dashboard/utils';
import { getHostPowerStatus } from './selectors';
import { HOST_POWER_STATUS_POWERING_OFF, HOST_POWER_STATUS_POWERING_ON } from './constants';
import { BareMetalHostKind } from './types';
import { detectBaremetalPlatform, BAREMETAL_FLAG, NODE_MAINTENANCE_FLAG } from './features';

type ConsumedExtensions =
  | DashboardsOverviewInventoryItem
  | DashboardsOverviewInventoryItemReplacement
  | DashboardsInventoryItemGroup
  | HrefNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
  | ModelFeatureFlag
  | ModelDefinition
  | CustomFeatureFlag
  | DashboardsOverviewResourceActivity
  | ResourceTabPage;

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
    type: 'FeatureFlag/Model',
    properties: {
      model: NodeMaintenanceModel,
      flag: NODE_MAINTENANCE_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectBaremetalPlatform,
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Compute',
      componentProps: {
        name: 'Bare Metal Hosts',
        href: formatNamespacedRouteForResource(
          referenceForModel(BareMetalHostModel),
          'openshift-machine-api',
        ),
      },
      mergeBefore: 'ComputeSeparator',
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
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
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(BareMetalHostModel)}/:name/edit`,
      loader: () =>
        import(
          './components/baremetal-hosts/add-baremetal-host/AddBareMetalHostPage' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.default),
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item/Replacement',
    properties: {
      model: NodeModel,
      additionalResources: {
        maintenances: {
          isList: true,
          kind: referenceForModel(NodeMaintenanceModel),
          optional: true,
        },
      },
      mapper: getBMNStatusGroups,
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      additionalResources: {
        machines: {
          isList: true,
          kind: referenceForModel(MachineModel),
        },
        nodes: {
          isList: true,
          kind: NodeModel.kind,
        },
        maintenances: {
          isList: true,
          kind: referenceForModel(NodeMaintenanceModel),
          optional: true,
        },
      },
      model: BareMetalHostModel,
      mapper: getBMHStatusGroups,
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
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
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: ['/k8s/cluster/nodes/:name'],
      loader: () =>
        import(
          './components/baremetal-nodes/BareMetalNodeDetailsPage' /* webpackChunkName: "node" */
        ).then((m) => m.default),
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: referenceForModel(NodeMaintenanceModel),
        prop: 'maintenances',
      },
      isActivity: (resource) => _.get(resource.status, 'phase') === 'Running',
      getTimestamp: (resource) => new Date(resource.metadata.creationTimestamp),
      loader: () =>
        import(
          './components/maintenance/MaintenanceDashboardActivity' /* webpackChunkName: "node-maintenance" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Dashboards/Inventory/Item/Group',
    properties: {
      id: 'node-maintenance',
      icon: <MaintenanceIcon />,
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        kind: referenceForModel(BareMetalHostModel),
        prop: 'bmhs',
        isList: true,
      },
      isActivity: (resource: BareMetalHostKind) =>
        [HOST_POWER_STATUS_POWERING_OFF, HOST_POWER_STATUS_POWERING_ON].includes(
          getHostPowerStatus(resource),
        ),
      loader: () =>
        import(
          './components/baremetal-hosts/dashboard/BareMetalStatusActivity' /* webpackChunkName: "metal3-powering" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'nics',
      model: NodeModel,
      name: 'Network Interfaces',
      loader: () =>
        import('./components/baremetal-nodes/NICsPage').then(
          (m) => m.default,
        ) /* webpackChunkName: "metal3-bmn-nics" */,
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'disks',
      model: NodeModel,
      name: 'Disks',
      loader: () =>
        import('./components/baremetal-nodes/DisksPage').then(
          (m) => m.default,
        ) /* webpackChunkName: "metal3-bmn-disks" */,
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
];

export default plugin;
