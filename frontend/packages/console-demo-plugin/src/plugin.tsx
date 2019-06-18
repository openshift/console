import * as React from 'react';
import * as _ from 'lodash-es';

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
  DashboardsOverviewCapacityQuery,
  DashboardsCard,
} from '@console/plugin-sdk';

// TODO(vojtech): internal code needed by plugins should be moved to console-shared package
import { PodModel } from '@console/internal/models';
import { FLAGS } from '@console/internal/const';
import { CAPACITY_QUERY } from '@console/internal/components/dashboards-page/overview-dashboard/capacity-query-types';

import * as models from './models';
import { yamlTemplates } from './yaml-templates';
import { getFooHealthState, getBarHealthState } from './dashboards/health';
import { FooCard } from './dashboards/foo-card';

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
  | DashboardsOverviewCapacityQuery
  | DashboardsCard;

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
      model: PodModel,
      loader: () =>
        import('@console/internal/components/pod' /* webpackChunkName: "pod" */).then(
          (m) => m.PodsPage,
        ),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: PodModel,
      loader: () =>
        import('@console/internal/components/pod' /* webpackChunkName: "pod" */).then(
          (m) => m.PodsDetailsPage,
        ),
    },
  },
  {
    type: 'Perspective',
    properties: {
      id: 'test',
      name: 'Test Perspective',
      icon: (
        <svg
          style={{ verticalAlign: '-0.125em' }}
          fill="currentColor"
          height="1em"
          width="1em"
          viewBox="0 0 640 512"
          role="img"
        >
          <path d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z" />
        </svg>
      ),
      landingPageURL: '/test',
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.FooBarModel,
      template: yamlTemplates.getIn([models.FooBarModel, 'default']),
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
    type: 'Dashboards/Overview/Capacity/Query',
    properties: {
      queryKey: CAPACITY_QUERY.STORAGE_TOTAL,
      query: 'fooQuery',
    },
  },
  {
    type: 'Dashboards/Overview/Capacity/Query',
    properties: {
      queryKey: CAPACITY_QUERY.STORAGE_USED,
      query: 'barQuery',
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'foo',
      component: FooCard,
    },
  },
];

export default plugin;
