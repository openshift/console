import * as React from 'react';
import * as _ from 'lodash';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  KebabActions,
  HrefNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  Perspective,
  RoutePage,
  OverviewCRD,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { CodeIcon } from '@patternfly/react-icons';
import { FLAGS } from '@console/internal/const';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';
import { getKebabActionsForKind } from './utils/kebab-actions';
import {
  tknPipelineAndPipelineRunsResources,
  getPipelinesAndPipelineRunsForResource,
} from './utils/pipeline-plugin-utils';
import { SHOW_PIPELINE, ALLOW_SERVICE_BINDING } from './const';

const { PipelineModel, PipelineRunModel } = models;

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | HrefNavItem
  | ResourceClusterNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | RoutePage
  | KebabActions
  | OverviewCRD;

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
      model: models.PipelineModel,
      flag: SHOW_PIPELINE,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.ServiceBindingRequestModel,
      flag: ALLOW_SERVICE_BINDING,
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: '+Add',
        href: '/add',
        testID: '+Add-header',
      },
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: 'Topology',
        href: '/topology',
        required: FLAGS.OPENSHIFT,
        testID: 'topology-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: 'Builds',
        resource: 'buildconfigs',
        required: FLAGS.OPENSHIFT,
        testID: 'build-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: 'Pipelines',
        resource: referenceForModel(PipelineModel),
        required: SHOW_PIPELINE,
        testID: 'pipeline-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Project Details',
        resource: 'projects',
        required: FLAGS.OPENSHIFT,
        testID: 'advanced-project-header',
      },
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Project Access',
        href: '/project-access',
        testID: 'advanced-project-access-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Events',
        resource: 'events',
        testID: 'advanced-events-header',
      },
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Metrics',
        href: '/metrics',
        required: FLAGS.OPENSHIFT,
        testID: 'metrics-header',
      },
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Search',
        href: '/search',
        testID: 'advanced-search-header',
      },
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: tknPipelineAndPipelineRunsResources,
      required: SHOW_PIPELINE,
      utils: getPipelinesAndPipelineRunsForResource,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: PipelineModel,
      loader: async () =>
        (await import(
          './components/pipelines/PipelinesPage' /* webpackChunkName: "pipeline-list" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: PipelineModel,
      loader: async () =>
        (await import(
          './components/pipelines/PipelineDetailsPage' /* webpackChunkName: "pipeline-details" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: PipelineRunModel,
      loader: async () =>
        (await import(
          './components/pipelineruns/PipelineRunResourceList' /* webpackChunkName: "pipelinerun-list" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: PipelineRunModel,
      loader: async () =>
        (await import(
          './components/pipelineruns/PipelineRunDetailsPage' /* webpackChunkName: "pipelinerun-details" */
        )).default,
    },
  },
  {
    type: 'Perspective',
    properties: {
      id: 'dev',
      name: 'Developer',
      icon: <CodeIcon />,
      getLandingPageURL: () => '/topology',
      getK8sLandingPageURL: () => '/add',
      getImportRedirectURL: (project) => `/topology/ns/${project}`,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/add', '/import', '/topology', '/deploy-image', '/metrics', '/project-access'],
      component: NamespaceRedirect,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/add/all-namespaces', '/add/ns/:ns'],
      loader: async () =>
        (await import('./components/AddPage' /* webpackChunkName: "dev-console-add" */)).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/topology/all-namespaces', '/topology/ns/:ns'],
      loader: async () =>
        (await import(
          './components/topology/TopologyPage' /* webpackChunkName: "dev-console-topology" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/import/all-namespaces', '/import/ns/:ns'],
      loader: async () =>
        (await import(
          './components/import/ImportPage' /* webpackChunkName: "dev-console-import" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/catalog/source-to-image'],
      loader: async () =>
        (await import(
          './components/import/ImportPage' /* webpackChunkName: "dev-console-import" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: true,
      path: ['/k8s/all-namespaces/buildconfigs', '/k8s/ns/:ns/buildconfigs'],
      loader: async () =>
        (await import(
          './components/BuildConfigPage' /* webpackChunkName: "dev-console-buildconfigs" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/deploy-image/all-namespaces', '/deploy-image/ns/:ns'],
      loader: async () =>
        (await import(
          './components/import/DeployImagePage' /* webpackChunkName: "dev-console-deployImage" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: true,
      path: ['/k8s/cluster/projects'],
      loader: async () =>
        (await import(
          './components/projects/details/AllProjectsDetailList' /* webpackChunkName: "all-projects-detail-list" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      path: ['/k8s/cluster/projects/:name'],
      loader: async () =>
        (await import(
          './components/projects/details/ProjectDetailsPage' /* webpackChunkName: "project-details" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/metrics/all-namespaces', '/metrics/ns/:ns'],
      loader: async () =>
        (await import('./components/MetricsPage' /* webpackChunkName: "dev-console-metrics" */))
          .default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/project-access/all-namespaces', '/project-access/ns/:ns'],
      loader: async () =>
        (await import(
          './components/project-access/ProjectAccessPage' /* webpackChunkName: "dev-console-projectAccess" */
        )).default,
    },
  },
  {
    type: 'KebabActions',
    properties: {
      getKebabActionsForKind,
    },
  },
];

export default plugin;
