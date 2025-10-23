import * as _ from 'lodash';
// TODO(vojtech): internal code needed by plugins should be moved to console-shared package
import { PodModel, RouteModel, NodeModel } from '@console/internal/models';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  DashboardsOverviewInventoryItem,
  DashboardsInventoryItemGroup,
  DashboardsOverviewResourceActivity,
} from '@console/plugin-sdk';
import { DemoGroupIcon } from './components/dashboards/inventory';
import { FooBarModel } from './models';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
  | DashboardsOverviewInventoryItem
  | DashboardsInventoryItemGroup
  | DashboardsOverviewResourceActivity;

const TEST_MODEL_FLAG = 'TEST_MODEL';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: [FooBarModel],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: PodModel,
      flag: TEST_MODEL_FLAG,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: FooBarModel,
      loader: () =>
        import('./components/test-pages' /* webpackChunkName: "demo" */).then(
          (m) => m.DummyResourceListPage,
        ),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: FooBarModel,
      loader: () =>
        import('./components/test-pages' /* webpackChunkName: "demo" */).then(
          (m) => m.DummyResourceDetailsPage,
        ),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/test',
      render: () => <h1>Test Page</h1>,
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      model: RouteModel,
      mapper: () =>
        import('./components/dashboards/inventory' /* webpackChunkName: "demo" */).then(
          (m) => m.getRouteStatusGroups,
        ),
      expandedComponent: () =>
        import(
          './components/dashboards/inventory' /* webpackChunkName: "demo-inventory-item" */
        ).then((m) => m.ExpandedRoutes),
    },
    flags: {
      required: [TEST_MODEL_FLAG],
    },
  },
  {
    type: 'Dashboards/Inventory/Item/Group',
    properties: {
      id: 'demo-inventory-group',
      icon: <DemoGroupIcon />,
    },
    flags: {
      required: [TEST_MODEL_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: NodeModel.kind,
        prop: 'nodes',
      },
      isActivity: (resource) =>
        _.get(resource, ['metadata', 'labels', 'node-role.kubernetes.io/master']) === '',
      getTimestamp: (resource) => new Date(resource.metadata.creationTimestamp),
      loader: () =>
        import('./components/dashboards/activity' /* webpackChunkName: "demo" */).then(
          (m) => m.DemoActivity,
        ),
    },
    flags: {
      required: [TEST_MODEL_FLAG],
    },
  },
];

export default plugin;
