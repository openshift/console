import * as React from 'react';
import { CodeIcon } from '@patternfly/react-icons';
import {
  Plugin,
  ModelFeatureFlag,
  KebabActions,
  NavSection,
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
  GuidedTour,
  PostFormSubmissionAction,
  CustomFeatureFlag,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { FLAGS } from '@console/shared/src/constants';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { doConnectsToBinding } from '@console/topology/src/utils/connector-utils';
import { getKebabActionsForKind } from './utils/kebab-actions';
import { INCONTEXT_ACTIONS_CONNECTS_TO } from './const';
import { usePerspectiveDetection } from './utils/usePerspectiveDetection';
import { getGuidedTour } from './components/guided-tour';

type ConsumedExtensions =
  | ModelFeatureFlag
  | NavSection
  | CustomFeatureFlag
  | HrefNavItem
  | ResourceClusterNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | RoutePage
  | KebabActions
  | OverviewResourceTab
  | YAMLTemplate
  | OverviewTabSection
  | GuidedTour
  | PostFormSubmissionAction;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Nav/Section',
    properties: {
      id: 'top',
      perspective: 'dev',
    },
  },
  {
    type: 'Nav/Section',
    properties: {
      id: 'resources',
      perspective: 'dev',
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'add',
      perspective: 'dev',
      section: 'top',
      componentProps: {
        // t('devconsole~+Add')
        name: '%devconsole~+Add%',
        href: '/add',
        namespaced: true,
        testID: '+Add-header',
        'data-quickstart-id': 'qs-nav-add',
      },
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'topology',
      perspective: 'dev',
      section: 'top',
      componentProps: {
        // t('devconsole~Topology')
        name: '%devconsole~Topology%',
        href: '/topology',
        namespaced: true,
        testID: 'topology-header',
        'data-quickstart-id': 'qs-nav-topology',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'monitoring',
      perspective: 'dev',
      section: 'top',
      componentProps: {
        // t('devconsole~Monitoring')
        name: '%devconsole~Monitoring%',
        href: '/dev-monitoring',
        namespaced: true,
        testID: 'monitoring-header',
        'data-tour-id': 'tour-monitoring-nav',
        'data-quickstart-id': 'qs-nav-monitoring',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'search',
      perspective: 'dev',
      section: 'top',
      componentProps: {
        // t('devconsole~Search')
        name: '%devconsole~Search%',
        href: '/search',
        namespaced: true,
        testID: 'search-header',
        'data-tour-id': 'tour-search-nav',
        'data-quickstart-id': 'qs-nav-search',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      id: 'builds',
      perspective: 'dev',
      section: 'resources',
      componentProps: {
        // t('devconsole~Builds')
        name: '%devconsole~Builds%',
        resource: 'buildconfigs',
        testID: 'build-header',
        'data-quickstart-id': 'qs-nav-builds',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'project',
      perspective: 'dev',
      section: 'resources',
      componentProps: {
        // t('devconsole~Project')
        name: '%devconsole~Project%',
        href: '/project-details',
        namespaced: true,
        testID: 'project-details-header',
        'data-quickstart-id': 'qs-nav-project',
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'Overview/Resource',
    properties: {
      // t('devconsole~Monitoring')
      name: '%devconsole~Monitoring%',
      key: 'isMonitorable',
      loader: () =>
        import(
          './components/monitoring/overview/MonitoringTab' /* webpackChunkName: "monitoring-overview" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Perspective',
    properties: {
      id: 'dev',
      // t('devconsole~Developer')
      name: '%devconsole~Developer%',
      icon: <CodeIcon />,
      defaultPins: [referenceForModel(ConfigMapModel), referenceForModel(SecretModel)],
      getLandingPageURL: (flags, isFirstVisit) => (isFirstVisit ? '/add' : '/topology'),
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
        '/catalog',
        '/samples',
        '/topology',
        '/deploy-image',
        '/project-details',
        '/dev-monitoring',
        '/helm-releases',
        '/upload-jar',
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
];

export default plugin;
