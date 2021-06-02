import * as _ from 'lodash';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { ModelDefinition, CustomFeatureFlag, RoutePage, Plugin } from '@console/plugin-sdk';
import { FLAG_OPENSHIFT_HELM } from './const';
import * as models from './models';
import {
  HelmTopologyConsumedExtensions,
  helmTopologyPlugin,
} from './topology/helm-topology-plugin';
import { detectHelmChartRepositories } from './utils/helm-detection-utils';

type ConsumedExtensions =
  | ModelDefinition
  | CustomFeatureFlag
  | RoutePage
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
  ...helmTopologyPlugin,
];

export default plugin;
