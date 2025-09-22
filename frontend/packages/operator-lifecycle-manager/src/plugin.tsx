import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  ResourceDetailsPage,
  ResourceListPage,
  RoutePage,
} from '@console/plugin-sdk';
import { Flags } from './const';
import * as models from './models';

import './style.scss';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage;

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
      model: models.ClusterServiceVersionModel,
      flag: Flags.OPERATOR_LIFECYCLE_MANAGER,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(
        models.ClusterServiceVersionModel,
      )}/:csvName/:plural/~new`,
      loader: async () =>
        (
          await import(
            './components/operand/create-operand' /* webpackChunkName: "create-operand" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.ClusterServiceVersionModel.plural}/:csvName/:plural/~new`,
      loader: async () =>
        (
          await import(
            './components/operand/create-operand' /* webpackChunkName: "create-operand" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/k8s/ns/:ns/${models.ClusterServiceVersionModel.plural}/:appName/:plural/:name`,
      loader: async () =>
        (await import('./components/operand' /* webpackChunkName: "operand" */)).OperandDetailsPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/k8s/ns/:ns/${referenceForModel(
        models.ClusterServiceVersionModel,
      )}/:appName/:plural/:name`,
      loader: async () =>
        (await import('./components/operand' /* webpackChunkName: "operand" */)).OperandDetailsPage,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.SubscriptionModel,
      loader: async () =>
        (await import('./components/subscription' /* webpackChunkName: "subscriptions" */))
          .SubscriptionsPage,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.SubscriptionModel,
      loader: async () =>
        (await import('./components/subscription' /* webpackChunkName: "subscriptions" */))
          .SubscriptionDetailsPage,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.ClusterServiceVersionModel,
      loader: async () =>
        (
          await import(
            './components/clusterserviceversion' /* webpackChunkName: "clusterserviceversion" */
          )
        ).ClusterServiceVersionsPage,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.PackageManifestModel,
      loader: async () =>
        (await import('./components/package-manifest' /* webpackChunkName: "package-manifest" */))
          .PackageManifestsPage,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.ClusterServiceVersionModel,
      loader: async () =>
        (
          await import(
            './components/clusterserviceversion' /* webpackChunkName: "clusterserviceversion" */
          )
        ).ClusterServiceVersionDetailsPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.SubscriptionModel.plural}/~new`,
      loader: async () =>
        (
          await import(
            './components/catalog-source' /* webpackChunkName: "create-subscription-yaml" */
          )
        ).CreateSubscriptionYAML,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/operatorhub/subscribe',
      loader: async () =>
        (
          await import(
            './components/operator-hub/operator-hub-subscribe' /* webpackChunkName: "operator-hub-subscribe" */
          )
        ).OperatorHubSubscribePage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.SubscriptionModel.plural}/~new`,
      loader: async () =>
        (
          await import(
            './components/catalog-source' /* webpackChunkName: "create-subscription-yaml" */
          )
        ).CreateSubscriptionYAML,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.OperatorHubModel,
      loader: async () =>
        (await import('./components/operator-hub/operator-hub-details')).OperatorHubDetailsPage,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.CatalogSourceModel,
      loader: async () =>
        (await import('./components/catalog-source' /* webpackChunkName: "catalog-source" */))
          .CatalogSourceDetailsPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/cluster/${referenceForModel(models.CatalogSourceModel)}/~new`,
      loader: async () => (await import('./components/create-catalog-source')).CreateCatalogSource,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(models.CatalogSourceModel)}/~new`,
      loader: async () => (await import('./components/create-catalog-source')).CreateCatalogSource,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.InstallPlanModel,
      loader: async () =>
        (await import('./components/install-plan' /* webpackChunkName: "install-plan" */))
          .InstallPlanDetailsPage,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.InstallPlanModel,
      loader: async () =>
        (await import('./components/install-plan' /* webpackChunkName: "install-plan" */))
          .InstallPlansPage,
    },
  },
];

export default plugin;
