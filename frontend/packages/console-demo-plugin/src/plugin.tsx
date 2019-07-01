import * as React from 'react';

import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  HrefNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  Perspective,
  YAMLTemplate,
  RoutePage,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsCard,
  DashboardsTab,
  DashboardsOverviewCapacityQuery,
} from '@console/plugin-sdk';

// TODO(vojtech): internal code needed by plugins should be moved to console-shared package
import { PodModel } from '@console/internal/models';
import { FLAGS } from '@console/internal/const';
import { GridPosition } from '@console/internal/components/dashboard/grid';
import { CapacityQuery } from '@console/internal/components/dashboards-page/overview-dashboard/capacity-query-types';

import { FooBarModel } from './models';
import { yamlTemplates } from './yaml-templates';
import TestIcon from './components/test-icon';
import { getFooHealthState, getBarHealthState } from './dashboards/health';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceClusterNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | YAMLTemplate
  | RoutePage
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewHealthURLSubsystem<any>
  | DashboardsTab
  | DashboardsCard
  | DashboardsOverviewCapacityQuery;

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
      flag: 'TEST_MODEL_FLAG',
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Home',
      componentProps: {
        name: 'Test Href Link',
        href: '/test',
        required: 'TEST_MODEL_FLAG',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Home',
      componentProps: {
        name: 'Test ResourceNS Link',
        resource: 'pods',
        required: 'TEST_MODEL_FLAG',
      },
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      section: 'Home',
      componentProps: {
        name: 'Test ResourceCluster Link',
        resource: 'projects',
        required: [FLAGS.OPENSHIFT, 'TEST_MODEL_FLAG'],
      },
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: FooBarModel,
      loader: () =>
        import('./components/test-pages' /* webpackChunkName: "demo-foobars" */).then(
          (m) => m.DummyResourceListPage,
        ),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: FooBarModel,
      loader: () =>
        import('./components/test-pages' /* webpackChunkName: "demo-foobars" */).then(
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
      landingPageURL: '/test',
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: FooBarModel,
      template: yamlTemplates.getIn([FooBarModel, 'default']),
    },
  },
  {
    type: 'Dashboards/Overview/Health/URL',
    properties: {
      title: 'Foo system',
      url: 'fooUrl',
      healthHandler: getFooHealthState,
    },
  },
  {
    type: 'Dashboards/Overview/Health/Prometheus',
    properties: {
      title: 'Bar system',
      query: 'barQuery',
      healthHandler: getBarHealthState,
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'test',
      componentProps: {
        name: 'Test Home',
        href: '/test',
      },
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      perspective: 'test',
      section: 'Advanced',
      componentProps: {
        name: 'Test Projects',
        resource: 'projects',
      },
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
      title: 'Foo',
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'foo-tab',
      position: GridPosition.MAIN,
      loader: () =>
        import('./dashboards/foo-card' /* webpackChunkName: "demo-card" */).then((m) => m.FooCard),
    },
  },
  {
    type: 'Dashboards/Overview/Capacity/Query',
    properties: {
      queryKey: CapacityQuery.STORAGE_TOTAL,
      query: 'fooQuery',
    },
  },
  {
    type: 'Dashboards/Overview/Capacity/Query',
    properties: {
      queryKey: CapacityQuery.STORAGE_USED,
      query: 'barQuery',
    },
  },
];

export default plugin;
