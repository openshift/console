import * as React from 'react';
import * as _ from 'lodash';
// TODO(vojtech): internal code needed by plugins should be moved to console-shared package
import { PodModel, RouteModel, NodeModel } from '@console/internal/models';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  ResourceListPage,
  ResourceDetailsPage,
  Perspective,
  RoutePage,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsCard,
  DashboardsTab,
  DashboardsOverviewInventoryItem,
  DashboardsInventoryItemGroup,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewPrometheusActivity,
  HorizontalNavTab,
} from '@console/plugin-sdk';
import { GridPosition } from '@console/shared/src/components/dashboard/DashboardGrid';
import { getFooHealthState, getBarHealthState } from './components/dashboards/health';
import { DemoGroupIcon } from './components/dashboards/inventory';
import TestIcon from './components/test-icon';
import { FooBarModel } from './models';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | RoutePage
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsTab
  | DashboardsCard
  | DashboardsOverviewInventoryItem
  | DashboardsInventoryItemGroup
  | DashboardsOverviewResourceActivity
  | DashboardsOverviewPrometheusActivity
  | HorizontalNavTab;

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
    type: 'Perspective',
    properties: {
      id: 'test',
      name: 'Test Perspective',
      icon: TestIcon,
      getLandingPageURL: () => '/test',
      getK8sLandingPageURL: () => '/test',
      getImportRedirectURL: (project) => `/k8s/cluster/projects/${project}/workloads`,
    },
  },
  {
    type: 'Dashboards/Overview/Health/URL',
    properties: {
      title: 'Foo system',
      url: 'fooUrl',
      healthHandler: getFooHealthState,
    },
    flags: {
      required: [TEST_MODEL_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Health/Prometheus',
    properties: {
      title: 'Bar system',
      queries: ['barQuery'],
      healthHandler: getBarHealthState,
      additionalResource: {
        kind: NodeModel.kind,
        isList: true,
        namespaced: false,
        prop: 'nodes',
      },
    },
    flags: {
      required: [TEST_MODEL_FLAG],
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
    type: 'Dashboards/Tab',
    properties: {
      id: 'foo-tab',
      navSection: 'home',
      title: 'Foo',
    },
    flags: {
      required: [TEST_MODEL_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'foo-tab',
      position: GridPosition.MAIN,
      loader: () =>
        import('./components/dashboards/foo-card' /* webpackChunkName: "demo" */).then(
          (m) => m.FooCard,
        ),
    },
    flags: {
      required: [TEST_MODEL_FLAG],
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
  {
    type: 'Dashboards/Overview/Activity/Prometheus',
    properties: {
      queries: ['barQuery'],
      isActivity: () => true,
      loader: () =>
        import('./components/dashboards/activity' /* webpackChunkName: "demo" */).then(
          (m) => m.DemoPrometheusActivity,
        ),
    },
    flags: {
      required: [TEST_MODEL_FLAG],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: PodModel,
      page: {
        href: 'example',
        name: 'Example',
      },
      loader: () =>
        import('./components/test-pages' /* webpackChunkName: "demo" */).then(
          (m) => m.DummyHorizontalNavTab,
        ),
    },
  },
];

export default plugin;
