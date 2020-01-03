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
  YAMLTemplate,
  OverviewTabSection,
  ReduxReducer,
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
import { FLAG_OPENSHIFT_PIPELINE, ALLOW_SERVICE_BINDING } from './const';
import {
  newPipelineTemplate,
  newTaskTemplate,
  newTaskRunTemplate,
  newPipelineResourceTemplate,
  newClusterTaskTemplate,
} from './templates';
import reducer from './utils/reducer';

const {
  ClusterTaskModel,
  PipelineModel,
  PipelineResourceModel,
  PipelineRunModel,
  TaskModel,
  TaskRunModel,
} = models;

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
  | ReduxReducer
  | KebabActions
  | OverviewCRD
  | YAMLTemplate
  | OverviewTabSection;

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
      flag: FLAG_OPENSHIFT_PIPELINE,
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
        name: PipelineModel.labelPlural,
        resource: referenceForModel(PipelineModel),
        required: FLAG_OPENSHIFT_PIPELINE,
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
    type: 'Overview/CRD',
    properties: {
      resources: tknPipelineAndPipelineRunsResources,
      required: FLAG_OPENSHIFT_PIPELINE,
      utils: getPipelinesAndPipelineRunsForResource,
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: PipelineModel.labelPlural,
        resource: referenceForModel(PipelineModel),
        required: FLAG_OPENSHIFT_PIPELINE,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: PipelineRunModel.labelPlural,
        resource: referenceForModel(PipelineRunModel),
        required: FLAG_OPENSHIFT_PIPELINE,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: PipelineResourceModel.labelPlural,
        resource: referenceForModel(PipelineResourceModel),
        required: FLAG_OPENSHIFT_PIPELINE,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: TaskModel.labelPlural,
        resource: referenceForModel(TaskModel),
        required: FLAG_OPENSHIFT_PIPELINE,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: TaskRunModel.labelPlural,
        resource: referenceForModel(TaskRunModel),
        required: FLAG_OPENSHIFT_PIPELINE,
      },
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: ClusterTaskModel.labelPlural,
        resource: referenceForModel(ClusterTaskModel),
        required: FLAG_OPENSHIFT_PIPELINE,
      },
    },
  },
  {
    type: 'Overview/Section',
    properties: {
      key: 'pipelines',
      loader: () =>
        import(
          './components/pipelines/pipeline-overview/PipelineOverview' /* webpackChunkName: "pipeline-overview-list" */
        ).then((m) => m.default),
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
    type: 'Page/Resource/Details',
    properties: {
      model: TaskRunModel,
      loader: async () =>
        (await import(
          './components/taskruns/TaskRunDetailsPage' /* webpackChunkName: "taskrun-details" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: PipelineModel,
      loader: async () =>
        (await import(
          './components/pipelines/PipelinesResourceList' /* webpackChunkName: "pipeline-resource-list" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: PipelineRunModel,
      loader: async () =>
        (await import(
          './components/pipelineruns/PipelineRunsResourceList' /* webpackChunkName: "pipelinerun-resource-list" */
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
      path: [
        '/topology/all-namespaces',
        '/topology/ns/:name',
        '/topology/all-namespaces/list',
        '/topology/ns/:name/list',
      ],
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
      perspective: 'dev',
      exact: true,
      path: [
        `/k8s/all-namespaces/${referenceForModel(PipelineModel)}`,
        `/k8s/ns/:ns/${referenceForModel(PipelineModel)}`,
      ],
      loader: async () =>
        (await import(
          './components/pipelines/PipelinesPage' /* webpackChunkName: "pipeline-page" */
        )).PipelinesPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: true,
      path: [
        `/k8s/all-namespaces/${referenceForModel(PipelineRunModel)}`,
        `/k8s/ns/:ns/${referenceForModel(PipelineRunModel)}`,
      ],
      loader: async () =>
        (await import(
          './components/pipelineruns/PipelineRunsPage' /* webpackChunkName: "pipelinerun-page" */
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
    type: 'ReduxReducer',
    properties: {
      namespace: 'devconsole',
      reducer,
    },
  },
  {
    type: 'KebabActions',
    properties: {
      getKebabActionsForKind,
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: PipelineModel,
      template: newPipelineTemplate,
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: TaskModel,
      template: newTaskTemplate,
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: TaskRunModel,
      template: newTaskRunTemplate,
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: PipelineResourceModel,
      template: newPipelineResourceTemplate,
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: ClusterTaskModel,
      template: newClusterTaskTemplate,
    },
  },
];

export default plugin;
