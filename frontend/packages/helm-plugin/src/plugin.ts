import * as _ from 'lodash';
import * as helmIcon from '@console/internal/imgs/logos/helm.svg';
import { AddAction } from '@console/dev-console/src/extensions/add-actions';
import {
  ModelDefinition,
  CustomFeatureFlag,
  HrefNavItem,
  RoutePage,
  Plugin,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import {
  HelmTopologyConsumedExtensions,
  helmTopologyPlugin,
} from './topology/helm-topology-plugin';
import { HelmCatalogConsumedExtensions, helmCatalogPlugin } from './catalog/helm-catalog-plugin';
import { detectHelmChartRepositories } from './utils/helm-detection-utils';
import { FLAG_OPENSHIFT_HELM } from './const';
import * as models from './models';

type ConsumedExtensions =
  | ModelDefinition
  | CustomFeatureFlag
  | HrefNavItem
  | RoutePage
  | AddAction
  | HelmCatalogConsumedExtensions
  | HelmTopologyConsumedExtensions;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
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
      id: 'helm',
      perspective: 'dev',
      section: 'resources',
      insertBefore: 'project',
      componentProps: {
        // t('helm-plugin~Helm')
        name: '%helm-plugin~Helm%',
        href: '/helm-releases',
        testID: 'helm-releases-header',
        'data-quickstart-id': 'qs-nav-helm',
      },
    },
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/helm-releases'],
      component: NamespaceRedirect,
    },
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
            './components/forms/install-upgrade/HelmInstallUpgradePage' /* webpackChunkName: "helm-plugin-install-upgrade-form" */
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
            './components/forms/install-upgrade/HelmInstallUpgradePage' /* webpackChunkName: "helm-plugin-install-upgrade-form" */
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
            './components/forms/rollback/HelmReleaseRollbackPage' /* webpackChunkName: "helm-plugin-rollback-form" */
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
            './components/list-page/HelmReleaseListPage' /* webpackChunkName: "helm-plugin-releases-list-page" */
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
            './components/details-page/HelmReleaseDetailsPage' /* webpackChunkName: "helm-plugin-release-details-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
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
      // t('helm-plugin~Helm Chart')
      label: '%helm-plugin~Helm Chart%',
      // t('helm-plugin~Browse the catalog to discover and install Helm Charts')
      description: '%helm-plugin~Browse the catalog to discover and install Helm Charts%',
      icon: helmIcon,
    },
  },
  ...helmCatalogPlugin,
  ...helmTopologyPlugin,
];

export default plugin;
