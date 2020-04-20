import * as React from 'react';
import * as _ from 'lodash';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  KebabActions,
  HrefNavItem,
  SeparatorNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  Perspective,
  RoutePage,
  OverviewResourceTab,
  OverviewCRD,
  YAMLTemplate,
  OverviewTabSection,
  ReduxReducer,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { CodeIcon, BoltIcon, DatabaseIcon, CatalogIcon } from '@patternfly/react-icons';
import { FLAGS } from '@console/shared/src/constants';
import { referenceForModel } from '@console/internal/module/k8s';
import * as helmIcon from '@console/internal/imgs/logos/helm.svg';
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
import { AddAction } from './extensions/add-actions';
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
import * as yamlIcon from './images/yaml.svg';
import * as importGitIcon from './images/from-git.svg';
import * as dockerfileIcon from './images/dockerfile.svg';
import * as pipelineIcon from './images/pipeline.svg';

const {
  ClusterTaskModel,
  PipelineModel,
  PipelineResourceModel,
  PipelineRunModel,
  TaskModel,
  TaskRunModel,
  EventListenerModel,
  TriggerTemplateModel,
  TriggerBindingModel,
} = models;

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | HrefNavItem
  | ResourceClusterNavItem
  | SeparatorNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | RoutePage
  | ReduxReducer
  | KebabActions
  | OverviewResourceTab
  | OverviewCRD
  | YAMLTemplate
  | OverviewTabSection
  | AddAction;

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
      componentProps: {
        name: 'Monitoring',
        href: '/dev-monitoring',
        testID: 'monitoring-header',
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
      componentProps: {
        name: 'Search',
        href: '/search',
        testID: 'search-header',
      },
    },
  },
  {
    type: 'NavItem/Separator',
    properties: {
      perspective: 'dev',
      componentProps: {
        testID: 'dev-separator',
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
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
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
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
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
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
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
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
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
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_PIPELINE],
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
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        '/add',
        '/import',
        '/topology',
        '/deploy-image',
        '/project-details',
        '/dev-monitoring',
        '/helm-releases',
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
        ).PipelinesPage,
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
      id: 'import-from-git',
      url: '/import',
      label: 'From Git',
      description: 'Import code from your git repository to be built and deployed',
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
      description: 'Import your Dockerfile from your git repo to be built and deployed',
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
      url: '/catalog/ns/:namespace?kind=%5B"ClusterServiceVersion"%5D',
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
    },
  },
];

export default plugin;
