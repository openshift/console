import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import {
  Plugin,
  ModelFeatureFlag,
  KebabActions,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  OverviewResourceTab,
  OverviewTabSection,
  GuidedTour,
  PostFormSubmissionAction,
  CustomFeatureFlag,
} from '@console/plugin-sdk';
import { ALLOW_SERVICE_BINDING_FLAG } from '@console/topology/src/const';
import { TopologyDataModelFactory } from '@console/topology/src/extensions';
import { doConnectsToBinding } from '@console/topology/src/utils/connector-utils';
import { getGuidedTour } from './components/guided-tour';
import { getBindableServiceResources } from './components/topology/bindable-services/bindable-service-resources';
import { INCONTEXT_ACTIONS_CONNECTS_TO } from './const';
import { getKebabActionsForKind } from './utils/kebab-actions';

const getBindableServicesTopologyDataModel = () =>
  import(
    './components/topology/bindable-services/data-transformer' /* webpackChunkName: "topology-bindable-services" */
  ).then((m) => m.getBindableServicesTopologyDataModel);

const isServiceBindable = () =>
  import(
    './components/topology/bindable-services/isBindable' /* webpackChunkName: "topology-bindable-services" */
  ).then((m) => m.isServiceBindable);

type ConsumedExtensions =
  | ModelFeatureFlag
  | CustomFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
  | KebabActions
  | OverviewResourceTab
  | OverviewTabSection
  | GuidedTour
  | PostFormSubmissionAction
  | TopologyDataModelFactory;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Overview/Resource',
    properties: {
      // t('devconsole~Observe')
      name: '%devconsole~Observe%',
      key: 'isMonitorable',
      loader: () =>
        import(
          './components/monitoring/overview/MonitoringTab' /* webpackChunkName: "monitoring-overview" */
        ).then((m) => m.default),
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
        '/catalog',
        '/samples',
        '/topology',
        '/deploy-image',
        '/project-details',
        '/dev-monitoring',
        '/helm-releases',
        '/upload-jar',
        '/search-page',
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
        (await import('./components/add/AddPage' /* webpackChunkName: "dev-console-add" */))
          .default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/topology/all-namespaces', '/topology/ns/:name'],
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
      path: ['/catalog/all-namespaces', '/catalog/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/catalog/CatalogPage' /* webpackChunkName: "dev-console-extensible-catalog" */
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
      path: '/edit-deployment/ns/:ns',
      loader: async () =>
        (
          await import(
            './components/edit-deployment/EditDeploymentPage' /* webpackChunkName: "dev-console-edit-deployment" */
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
      path: ['/samples/all-namespaces/:is/:isNs', '/samples/ns/:ns/:is/:isNs'],
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
            './components/buildconfig/BuildConfigPage' /* webpackChunkName: "dev-console-buildconfig" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/buildconfigs/~new/form', '/k8s/ns/:ns/buildconfigs/:name/form'],
      loader: async () =>
        (
          await import(
            './components/buildconfig/BuildConfigFormPage' /* webpackChunkName: "dev-console-buildconfig-form" */
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
      path: ['/upload-jar/all-namespaces', '/upload-jar/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/import/jar/UploadJarPage' /* webpackChunkName: "dev-console-uploadjar" */
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
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: true,
      path: ['/search-page/all-namespaces', '/search-page/ns/:ns'],
      loader: async () =>
        (await import('./components/SearchPage' /* webpackChunkName: "dev-console-search" */))
          .default,
    },
  },
  {
    type: 'KebabActions',
    properties: {
      getKebabActionsForKind,
    },
  },
  {
    type: 'GuidedTour',
    properties: {
      perspective: 'dev',
      tour: getGuidedTour(),
    },
  },
  {
    type: 'PostFormSubmissionAction',
    properties: {
      type: INCONTEXT_ACTIONS_CONNECTS_TO,
      callback: doConnectsToBinding,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'bindable-service-topology-model-factory',
      priority: 100,
      resources: getBindableServiceResources,
      getDataModel: applyCodeRefSymbol(getBindableServicesTopologyDataModel),
      isResourceDepicted: applyCodeRefSymbol(isServiceBindable),
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
];

export default plugin;
