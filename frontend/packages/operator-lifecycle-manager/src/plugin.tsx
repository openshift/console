import * as _ from 'lodash';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  HrefNavItem,
  ResourceNSNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  DevCatalogModel,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { normalizeClusterServiceVersions } from './dev-catalog';
import * as models from './models';
import { Flags } from './const';
import './style.scss';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
  | DevCatalogModel;

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
    type: 'DevCatalogModel',
    properties: {
      model: models.ClusterServiceVersionModel,
      flag: Flags.OPERATOR_LIFECYCLE_MANAGER,
      normalize: normalizeClusterServiceVersions,
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Operators',
      componentProps: {
        name: 'OperatorHub',
        href: '/operatorhub',
        required: [Flags.CAN_LIST_PACKAGE_MANIFEST, Flags.CAN_LIST_OPERATOR_GROUP],
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Operators',
      componentProps: {
        name: 'Installed Operators',
        resource: referenceForModel(models.ClusterServiceVersionModel),
        startsWith: [
          models.ClusterServiceVersionModel.apiGroup,
          models.ClusterServiceVersionModel.plural,
        ],
      },
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(
        models.ClusterServiceVersionModel,
      )}/:appName/:plural/~new`,
      loader: async () =>
        (await import('./components/create-operand' /* webpackChunkName: "create-operand" */))
          .CreateOperandPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.ClusterServiceVersionModel.plural}/:appName/:plural/~new`,
      loader: async () =>
        (await import('./components/create-operand' /* webpackChunkName: "create-operand" */))
          .CreateOperandPage,
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
        (await import(
          './components/clusterserviceversion' /* webpackChunkName: "clusterserviceversion" */
        )).ClusterServiceVersionsPage,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.ClusterServiceVersionModel,
      loader: async () =>
        (await import(
          './components/clusterserviceversion' /* webpackChunkName: "clusterserviceversion" */
        )).ClusterServiceVersionsDetailsPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.SubscriptionModel.plural}/~new`,
      loader: async () =>
        (await import(
          './components/catalog-source' /* webpackChunkName: "create-subscription-yaml" */
        )).CreateSubscriptionYAML,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.ClusterServiceVersionModel.plural}/:appName/:plural/~new`,
      loader: async () =>
        (await import('./components/create-operand' /* webpackChunkName: "create-operand" */))
          .CreateOperandPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/operatorhub/all-namespaces',
      loader: async () =>
        (await import(
          './components/operator-hub/operator-hub-page' /* webpackChunkName: "operator-hub" */
        )).OperatorHubPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/operatorhub/ns/:ns',
      loader: async () =>
        (await import(
          './components/operator-hub/operator-hub-page' /* webpackChunkName: "operator-hub" */
        )).OperatorHubPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/operatorhub/subscribe',
      loader: async () =>
        (await import(
          './components/operator-hub/operator-hub-subscribe' /* webpackChunkName: "operator-hub-subscribe" */
        )).OperatorHubSubscribePage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.SubscriptionModel.plural}/~new`,
      loader: async () =>
        (await import(
          './components/catalog-source' /* webpackChunkName: "create-subscription-yaml" */
        )).CreateSubscriptionYAML,
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
