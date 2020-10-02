import * as React from 'react';
import * as _ from 'lodash';
import {
  BoltIcon,
  CatalogIcon,
  CodeIcon,
  DatabaseIcon,
  LaptopCodeIcon,
} from '@patternfly/react-icons';
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
  OverviewResourceTab,
  YAMLTemplate,
  OverviewTabSection,
  ReduxReducer,
  GuidedTour,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { FLAGS } from '@console/shared/src/constants';
import { referenceForModel } from '@console/internal/module/k8s';
import * as helmIcon from '@console/internal/imgs/logos/helm.svg';
import {
  BuildConfigModel,
  ImageStreamModel,
  DeploymentConfigModel,
  SecretModel,
  RouteModel,
  ServiceModel,
  ImageStreamImportsModel,
  ConfigMapModel,
} from '@console/internal/models';
import * as models from './models';
import { getKebabActionsForKind } from './utils/kebab-actions';
import { FLAG_OPENSHIFT_PIPELINE, ALLOW_SERVICE_BINDING, FLAG_OPENSHIFT_GITOPS } from './const';
import {
  newPipelineTemplate,
  newTaskTemplate,
  newTaskRunTemplate,
  newPipelineResourceTemplate,
  newClusterTaskTemplate,
} from './templates';
import reducer from './utils/reducer';
import { AddAction } from './extensions/add-actions';
import * as yamlIcon from './images/yaml.svg';
import * as importGitIcon from './images/from-git.svg';
import * as dockerfileIcon from './images/dockerfile.svg';
import * as pipelineIcon from './images/pipeline.svg';
import {
  HelmTopologyConsumedExtensions,
  helmTopologyPlugin,
} from './components/topology/helm/helmTopologyPlugin';
import {
  OperatorsTopologyConsumedExtensions,
  operatorsTopologyPlugin,
} from './components/topology/operators/operatorsTopologyPlugin';
import { pipelinesTopologyPlugin } from './components/topology/pipelines/pipelinesTopologyPlugin';
import { usePerspectiveDetection } from './utils/usePerspectiveDetection';
import { getGuidedTour } from './components/guided-tour';

const {
  ClusterTaskModel,
  PipelineModel,
  PipelineResourceModel,
  PipelineRunModel,
  ConditionModel,
  TaskModel,
  TaskRunModel,
  EventListenerModel,
  TriggerTemplateModel,
  TriggerBindingModel,
  ClusterTriggerBindingModel,
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
  | OverviewResourceTab
  | YAMLTemplate
  | OverviewTabSection
  | AddAction
  | GuidedTour
  | HelmTopologyConsumedExtensions
  | OperatorsTopologyConsumedExtensions;

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
      model: models.ServiceBindingModel,
      flag: ALLOW_SERVICE_BINDING,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.GitOpsServiceModel,
      flag: FLAG_OPENSHIFT_GITOPS,
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      group: 'top',
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
      group: 'top',
      componentProps: {
        name: 'Topology',
        href: '/topology',
        testID: 'topology-header',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      group: 'top',
      componentProps: {
        name: 'Monitoring',
        href: '/dev-monitoring',
        testID: 'monitoring-header',
        'data-tour-id': 'tour-monitoring-nav',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      group: 'top',
      componentProps: {
        name: 'Search',
        href: '/search',
        testID: 'search-header',
        'data-tour-id': 'tour-search-nav',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'dev',
      group: 'resources',
      componentProps: {
        name: 'Builds',
        resource: 'buildconfigs',
        testID: 'build-header',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'dev',
      group: 'resources',
      componentProps: {
        name: PipelineModel.labelPlural,
        resource: referenceForModel(PipelineModel),
        testID: 'pipeline-header',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      group: 'resources',
      componentProps: {
        name: 'Application Stages',
        href: '/applicationstages',
        testID: 'application-stages-header',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_GITOPS],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      group: 'resources',
      componentProps: {
        name: 'Helm',
        href: '/helm-releases',
        testID: 'helm-releases-header',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      group: 'resources',
      componentProps: {
        name: 'Project',
        href: '/project-details',
        testID: 'project-details-header',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: PipelineModel.labelPlural,
        href: '/pipelines',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: TaskModel.labelPlural,
        href: '/tasks',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'admin',
      section: 'Pipelines',
      componentProps: {
        name: 'Triggers',
        href: '/triggers',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
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
    type: 'Overview/Resource',
    properties: {
      name: 'Monitoring',
      key: 'isMonitorable',
      loader: () =>
        import(
          './components/monitoring/overview/MonitoringTab' /* webpackChunkName: "monitoring-overview" */
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
    type: 'Perspective',
    properties: {
      id: 'dev',
      name: 'Developer',
      icon: <CodeIcon />,
      defaultPins: [ConfigMapModel.kind, SecretModel.kind],
      getLandingPageURL: () => '/topology',
      getK8sLandingPageURL: () => '/add',
      getImportRedirectURL: (project) => `/topology/ns/${project}`,
      usePerspectiveDetection,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        '/add',
        '/import',
        '/import-sample',
        '/samples',
        '/topology',
        '/deploy-image',
        '/project-details',
        '/dev-monitoring',
        '/helm-releases',
        '/pipelines',
        '/tasks',
        '/triggers',
      ],
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
        '/topology/all-namespaces/graph',
        '/topology/ns/:name/graph',
        '/topology/all-namespaces/list',
        '/topology/ns/:name/list',
      ],
      loader: async () =>
        (
          await import(
            './components/topology/TopologyPage' /* webpackChunkName: "dev-console-topology" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/applicationstages',
      loader: async () =>
        (
          await import(
            './components/gitops/GitOpsListPage' /* webpackChunkName: "dev-console-gitops" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/applicationstages/:appName',
      loader: async () =>
        (
          await import(
            './components/gitops/GitOpsDetailsPage' /* webpackChunkName: "dev-console-gitops" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/edit/ns/:ns',
      loader: async () =>
        (
          await import(
            './components/edit-application/EditApplicationPage' /* webpackChunkName: "dev-console-edit" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/import/all-namespaces', '/import/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/import/ImportPage' /* webpackChunkName: "dev-console-import" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/samples/all-namespaces', '/samples/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/import/SamplesCatalog' /* webpackChunkName: "dev-console-samples-catalog" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/samples/ns/:ns/:is/:isNs'],
      loader: async () =>
        (
          await import(
            './components/import/ImportSamplePage' /* webpackChunkName: "dev-console-import-sample" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/catalog/source-to-image'],
      loader: async () =>
        (
          await import(
            './components/import/ImportPage' /* webpackChunkName: "dev-console-import" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: true,
      path: ['/k8s/all-namespaces/buildconfigs', '/k8s/ns/:ns/buildconfigs'],
      loader: async () =>
        (
          await import(
            './components/BuildConfigPage' /* webpackChunkName: "dev-console-buildconfigs" */
          )
        ).default,
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
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/deploy-image/all-namespaces', '/deploy-image/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/import/DeployImagePage' /* webpackChunkName: "dev-console-deployImage" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/catalog/helm-install'],
      loader: async () =>
        (
          await import(
            './components/helm/HelmInstallUpgradePage' /* webpackChunkName: "dev-console-helm-install-upgrade" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [`/helm-releases/ns/:ns/:releaseName/upgrade`],
      loader: async () =>
        (
          await import(
            './components/helm/HelmInstallUpgradePage' /* webpackChunkName: "dev-console-helm-install-upgrade" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [`/helm-releases/ns/:ns/:releaseName/rollback`],
      loader: async () =>
        (
          await import(
            './components/helm/HelmReleaseRollbackPage' /* webpackChunkName: "dev-console-helm-rollback" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/helm-releases/all-namespaces', '/helm-releases/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/helm/HelmReleaseListPage' /* webpackChunkName: "dev-console-helm-releases-list" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: ['/helm-releases/ns/:ns/release/:name'],
      exact: false,
      loader: async () =>
        (
          await import(
            './components/helm/HelmReleaseDetailsPage' /* webpackChunkName: "dev-console-helm-release-details" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: false,
      path: ['/project-details/all-namespaces', '/project-details/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/projects/details/ProjectDetailsPage' /* webpackChunkName: "dev-console-projectDetails" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/dev-monitoring/ns/:ns/alerts/:ruleID'],
      loader: async () =>
        (
          await import(
            './components/monitoring/alerts/MonitoringAlertsRulesDetailsPage' /* webpackChunkName: "dev-console-monitoring-alerts" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/dev-monitoring/ns/:ns/rules/:id'],
      loader: async () =>
        (
          await import(
            './components/monitoring/alerts/MonitoringAlertsRulesDetailsPage' /* webpackChunkName: "dev-console-monitoring-rules" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/dev-monitoring/all-namespaces', '/dev-monitoring/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/monitoring/MonitoringPage' /* webpackChunkName: "dev-console-monitoring" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/:kind/:name/containers/:containerName/health-checks'],
      loader: async () =>
        (
          await import(
            './components/health-checks/HealthChecksPage' /* webpackChunkName: "dev-console-healthCheck" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: false,
      path: ['/k8s/all-namespaces/import'],
      loader: async () =>
        (
          await import(
            '@console/internal/components/import-yaml' /* webpackChunkName: "import-yaml" */
          )
        ).ImportYamlPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: false,
      path: ['/k8s/all-namespaces/:plural'],
      loader: async () =>
        (
          await import(
            './components/ProjectSelectPage' /* webpackChunkName: "dev-console-projectselectpage" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/workload-hpa/ns/:ns/:resourceRef/:name'],
      loader: async () =>
        (await import('./components/hpa/HPAPage' /* webpackChunkName: "hpa-on-workload`" */))
          .default,
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
  {
    type: 'AddAction',
    properties: {
      id: 'import-from-samples',
      url: '/samples',
      label: 'Samples',
      description: 'Create an application from a code sample',
      icon: <LaptopCodeIcon />,
      accessReview: [
        BuildConfigModel,
        ImageStreamModel,
        DeploymentConfigModel,
        SecretModel,
        RouteModel,
        ServiceModel,
      ].map((model) => ({
        group: model.apiGroup || '',
        resource: model.plural,
        verb: 'create',
      })),
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'import-from-git',
      url: '/import',
      label: 'From Git',
      description: 'Import code from your Git repository to be built and deployed',
      icon: importGitIcon,
      accessReview: [
        BuildConfigModel,
        ImageStreamModel,
        DeploymentConfigModel,
        SecretModel,
        RouteModel,
        ServiceModel,
      ].map((model) => ({
        group: model.apiGroup || '',
        resource: model.plural,
        verb: 'create',
      })),
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'deploy-image',
      url: '/deploy-image',
      label: 'Container Image',
      description: 'Deploy an existing image from an image registry or image stream tag',
      iconClass: 'pficon-image',
      accessReview: [
        BuildConfigModel,
        ImageStreamModel,
        DeploymentConfigModel,
        ImageStreamImportsModel,
        SecretModel,
        RouteModel,
        ServiceModel,
      ].map((model) => ({
        group: model.apiGroup || '',
        resource: model.plural,
        verb: 'create',
      })),
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'import-from-dockerfile',
      url: '/import?importType=docker',
      label: 'From Dockerfile',
      description: 'Import your Dockerfile from your Git repository to be built and deployed',
      icon: dockerfileIcon,
      accessReview: [
        BuildConfigModel,
        ImageStreamModel,
        DeploymentConfigModel,
        SecretModel,
        RouteModel,
        ServiceModel,
      ].map((model) => ({
        group: model.apiGroup || '',
        resource: model.plural,
        verb: 'create',
      })),
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'import-yaml',
      url: '/k8s/ns/:namespace/import',
      label: 'YAML',
      description: 'Create resources from their YAML or JSON definitions',
      icon: yamlIcon,
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'dev-catalog',
      url: '/catalog',
      label: 'From Catalog',
      description: 'Browse the catalog to discover, deploy and connect to services',
      icon: <CatalogIcon />,
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'dev-catalog-databases',
      url: '/catalog?category=databases',
      label: 'Database',
      description: 'Browse the catalog to discover database services to add to your application',
      icon: <DatabaseIcon />,
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'operator-backed',
      url: '/catalog?kind=%5B"ClusterServiceVersion"%5D',
      label: 'Operator Backed',
      description: 'Browse the catalog to discover and deploy operator managed services',
      icon: <BoltIcon />,
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'helm',
      url: '/catalog?kind=%5B"HelmChart"%5D',
      label: 'Helm Chart',
      description: 'Browse the catalog to discover and install Helm Charts',
      icon: helmIcon,
    },
  },
  {
    type: 'AddAction',
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
    },
    properties: {
      id: 'pipeline',
      url: `/k8s/ns/:namespace/${referenceForModel(PipelineModel)}/~new/builder`,
      label: 'Pipeline',
      description: 'Create a Tekton Pipeline to automate delivery of your application',
      icon: pipelineIcon,
      accessReview: [
        {
          group: PipelineModel.apiGroup,
          resource: PipelineModel.plural,
          verb: 'create',
        },
      ],
    },
  },
  {
    type: 'GuidedTour',
    properties: {
      perspective: 'dev',
      tour: getGuidedTour(),
    },
  },
  ...helmTopologyPlugin,
  ...operatorsTopologyPlugin,
  ...pipelinesTopologyPlugin,
];

export default plugin;
