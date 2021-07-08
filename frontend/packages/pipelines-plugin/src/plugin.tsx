import * as _ from 'lodash';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  ResourceListPage,
  ResourceDetailsPage,
  Perspective,
  RoutePage,
  OverviewResourceTab,
  OverviewTabSection,
} from '@console/plugin-sdk';
import { FLAG_OPENSHIFT_PIPELINE } from './const';
import * as models from './models';
import {
  pipelinesTopologyPlugin,
  PipelineTopologyConsumedExtensions,
} from './topology/pipelinesTopologyPlugin';

const {
  PipelineModel,
  PipelineResourceModel,
  PipelineRunModel,
  ClusterTaskModel,
  ClusterTriggerBindingModel,
  ConditionModel,
  EventListenerModel,
  TaskModel,
  TaskRunModel,
  TriggerBindingModel,
  TriggerTemplateModel,
} = models;

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | RoutePage
  | OverviewResourceTab
  | OverviewTabSection
  | PipelineTopologyConsumedExtensions;

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
      model: PipelineModel,
      flag: FLAG_OPENSHIFT_PIPELINE,
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
        (
          await import(
            './components/pipelines/PipelineDetailsPage' /* webpackChunkName: "pipeline-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: PipelineRunModel,
      loader: async () =>
        (
          await import(
            './components/pipelineruns/PipelineRunDetailsPage' /* webpackChunkName: "pipelinerun-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: PipelineResourceModel,
      loader: async () =>
        (
          await import(
            './components/pipelines/detail-page-tabs/PipelineResourceDetailsPage' /* webpackChunkName: "pipelineresource-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: ConditionModel,
      loader: async () =>
        (
          await import(
            './components/pipelines/detail-page-tabs/PipelineConditionDetailsPage' /* webpackChunkName: "pipelinecondition-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: TaskRunModel,
      loader: async () =>
        (
          await import(
            './components/taskruns/TaskRunDetailsPage' /* webpackChunkName: "taskrun-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: ClusterTaskModel,
      loader: async () =>
        (
          await import(
            './components/cluster-tasks/ClusterTaskDetailsPage' /* webpackChunkName: "clustertask-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: TaskModel,
      loader: async () =>
        (await import('./components/tasks/TaskDetailsPage' /* webpackChunkName: "task-details" */))
          .default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: EventListenerModel,
      loader: async () =>
        (
          await import(
            './components/pipelines/EventListenerPage' /* webpackChunkName: "eventlistener-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: TriggerTemplateModel,
      loader: async () =>
        (
          await import(
            './components/pipelines/TriggerTemplatePage' /* webpackChunkName: "trigger-template-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: TriggerBindingModel,
      loader: async () =>
        (
          await import(
            './components/pipelines/TriggerBindingPage' /* webpackChunkName: "trigger-binding-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: ClusterTriggerBindingModel,
      loader: async () =>
        (
          await import(
            './components/pipelines/ClusterTriggerBindingPage' /* webpackChunkName: "cluster-trigger-binding-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: PipelineModel,
      loader: async () =>
        (
          await import(
            './components/pipelines/PipelinesResourceList' /* webpackChunkName: "pipeline-resource-list" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: PipelineRunModel,
      loader: async () =>
        (
          await import(
            './components/pipelineruns/PipelineRunsResourceList' /* webpackChunkName: "pipelinerun-resource-list" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: TaskRunModel,
      loader: async () =>
        (
          await import(
            './components/taskruns/list-page/TaskRunsListPage' /* webpackChunkName: "taskrun-resource-list" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: ConditionModel,
      loader: async () =>
        (
          await import(
            './components/conditions/ConditionListPage' /* webpackChunkName: "condition-list" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: TaskModel,
      loader: async () =>
        (
          await import(
            './components/tasks/TaskListPage' /* webpackChunkName: "task-resource-list" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: ClusterTaskModel,
      loader: async () =>
        (
          await import(
            './components/cluster-tasks/ClusterTaskListPage' /* webpackChunkName: "clustertask-resource-list" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/pipelines', '/tasks', '/triggers'],
      component: NamespaceRedirect,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/pipelines/all-namespaces', '/pipelines/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/pipelines-lists/PipelinesListsPage' /* webpackChunkName: "admin-pipeline" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/tasks/all-namespaces', '/tasks/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/tasks/list-page/TasksListsPage' /* webpackChunkName: "admin-tasks`" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/triggers/all-namespaces', '/triggers/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/triggers-lists/TriggersPage' /* webpackChunkName: "admin-triggers" */
          )
        ).default,
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
        (
          await import(
            './components/pipelines/PipelinesPage' /* webpackChunkName: "pipeline-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [`/k8s/ns/:ns/${referenceForModel(PipelineModel)}/~new/builder`],
      loader: async () =>
        (
          await import(
            './components/pipelines/pipeline-builder/PipelineBuilderPage' /* webpackChunkName: "pipeline-builder-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [`/k8s/ns/:ns/${referenceForModel(PipelineModel)}/:pipelineName/builder`],
      loader: async () =>
        (
          await import(
            './components/pipelines/pipeline-builder/PipelineBuilderEditPage' /* webpackChunkName: "pipeline-builder-edit-page" */
          )
        ).default,
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
        (
          await import(
            './components/pipelineruns/PipelineRunsPage' /* webpackChunkName: "pipelinerun-page" */
          )
        ).default,
    },
  },
  ...pipelinesTopologyPlugin,
];

export default plugin;
