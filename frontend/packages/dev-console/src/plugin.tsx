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
import { doConnectsToBinding } from '@console/topology/src/utils/connector-utils';
import * as models from './models';
import { getKebabActionsForKind } from './utils/kebab-actions';
import { FLAG_OPENSHIFT_GITOPS, INCONTEXT_ACTIONS_CONNECTS_TO, FLAG_OPENSHIFT_HELM } from './const';
import { AddAction } from './extensions/add-actions';
import * as yamlIcon from './images/yaml.svg';
import * as importGitIcon from './images/from-git.svg';
import * as dockerfileIcon from './images/dockerfile.svg';
import { usePerspectiveDetection } from './utils/usePerspectiveDetection';
import { getGuidedTour } from './components/guided-tour';
import { CatalogConsumedExtensions, catalogPlugin } from './components/catalog/catalog-plugin';
import { detectHelmChartRepositories } from './utils/helm-plugin-utils';

type ConsumedExtensions =
  | ModelDefinition
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
  | AddAction
  | GuidedTour
  | PostFormSubmissionAction
  | CatalogConsumedExtensions;

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
      model: models.GitOpsServiceModel,
      flag: FLAG_OPENSHIFT_GITOPS,
    },
  },
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
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectHelmChartRepositories,
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
        testID: '+Add-header',
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
      id: 'monitoring',
      perspective: 'dev',
      section: 'top',
      componentProps: {
        // t('devconsole~Monitoring')
        name: '%devconsole~Monitoring%',
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
      id: 'search',
      perspective: 'dev',
      section: 'top',
      componentProps: {
        // t('devconsole~Search')
        name: '%devconsole~Search%',
        href: '/search',
        testID: 'search-header',
        'data-tour-id': 'tour-search-nav',
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
      },
    },
    flags: {
      required: [FLAGS.OPENSHIFT],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'environments',
      perspective: 'dev',
      section: 'resources',
      componentProps: {
        // t('devconsole~Environments')
        name: '%devconsole~Environments%',
        href: '/environments',
        testID: 'environments-header',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_GITOPS],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'helm',
      perspective: 'dev',
      section: 'resources',
      componentProps: {
        // t('devconsole~Helm')
        name: '%devconsole~Helm%',
        href: '/helm-releases',
        testID: 'helm-releases-header',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
        testID: 'project-details-header',
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
        '/catalog',
        '/samples',
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
      path: '/environments',
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
      path: '/environments/:appName',
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
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
    type: 'AddAction',
    properties: {
      id: 'import-from-samples',
      url: '/samples',
      // t('devconsole~Samples')
      label: '%devconsole~Samples%',
      // t('devconsole~Create an application from a code sample')
      description: '%devconsole~Create an application from a code sample%',
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
      // t('devconsole~From Git')
      label: '%devconsole~From Git%',
      // t('devconsole~Import code from your Git repository to be built and deployed')
      description: '%devconsole~Import code from your Git repository to be built and deployed%',
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
      // t('devconsole~Container Image')
      label: '%devconsole~Container Image%',
      // t('devconsole~Deploy an existing image from an image registry or image stream tag')
      description:
        '%devconsole~Deploy an existing image from an image registry or image stream tag%',
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
      // t('devconsole~From Dockerfile')
      label: '%devconsole~From Dockerfile%',
      // t('devconsole~Import your Dockerfile from your Git repository to be built and deployed')
      description:
        '%devconsole~Import your Dockerfile from your Git repository to be built and deployed%',
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
      // t('devconsole~YAML')
      label: '%devconsole~YAML%',
      // t('devconsole~Create resources from their YAML or JSON definitions')
      description: '%devconsole~Create resources from their YAML or JSON definitions%',
      icon: yamlIcon,
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'dev-catalog',
      url: '/catalog',
      // t('devconsole~From Catalog')
      label: '%devconsole~From Catalog%',
      // t('devconsole~Browse the catalog to discover, deploy and connect to services')
      description: '%devconsole~Browse the catalog to discover, deploy and connect to services%',
      icon: <CatalogIcon />,
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'dev-catalog-databases',
      url: '/catalog?category=databases',
      // t('devconsole~Database')
      label: '%devconsole~Database%',
      // t('devconsole~Browse the catalog to discover database services to add to your application')
      description:
        '%devconsole~Browse the catalog to discover database services to add to your application%',
      icon: <DatabaseIcon />,
    },
  },
  {
    type: 'AddAction',
    properties: {
      id: 'operator-backed',
      url: '/catalog?catalogType=OperatorBackedService',
      // t('devconsole~Operator Backed')
      label: '%devconsole~Operator Backed%',
      // t('devconsole~Browse the catalog to discover and deploy operator managed services')
      description:
        '%devconsole~Browse the catalog to discover and deploy operator managed services%',
      icon: <BoltIcon />,
    },
  },
  {
    type: 'AddAction',
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
    },
    properties: {
      id: 'helm',
      url: '/catalog?catalogType=HelmChart',
      // t('devconsole~Helm Chart')
      label: '%devconsole~Helm Chart%',
      // t('devconsole~Browse the catalog to discover and install Helm Charts')
      description: '%devconsole~Browse the catalog to discover and install Helm Charts%',
      icon: helmIcon,
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
  ...catalogPlugin,
];

export default plugin;
