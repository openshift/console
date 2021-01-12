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
  DashboardsOverviewHealthOperator,
  CatalogItemProvider,
  CatalogItemType,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';
import { FLAGS } from '@console/shared/src/constants';
import { normalizeClusterServiceVersions } from './dev-catalog';
import * as models from './models';
import { Flags } from './const';
import { getClusterServiceVersionsWithStatuses } from './components/dashboard/utils';
import { ClusterServiceVersionKind } from './types';

import './style.scss';

const catalogCSVProvider = getExecutableCodeRef(() =>
  import('./utils/useClusterServiceVersions' /* webpackChunkName: "catalog-csv-provider" */).then(
    (m) => m.default,
  ),
);

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
  | DevCatalogModel
  | CatalogItemProvider
  | CatalogItemType
  | DashboardsOverviewHealthOperator<ClusterServiceVersionKind>;

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
      normalize: normalizeClusterServiceVersions,
    },
    flags: {
      required: [Flags.OPERATOR_LIFECYCLE_MANAGER],
    },
  },
  {
    type: 'Catalog/ItemType',
    properties: {
      type: 'OperatorBackedService',
      // t('olm~Operator Backed')
      title: '%olm~Operator Backed%',
      // t('olm~Browse for a variety of managed services that are installed by cluster administrators. Cluster administrators can customize the content made available in the catalog.')
      catalogDescription:
        '%olm~Browse for a variety of managed services that are installed by cluster administrators. Cluster administrators can customize the content made available in the catalog.%',
      // t('olm~**Operator backed** includes a variety of services managed by Kubernetes controllers.')
      typeDescription:
        '%olm~**Operator backed** includes a variety of services managed by Kubernetes controllers.%',
      groupings: [
        {
          label: 'Operators',
          attribute: 'operatorName',
        },
      ],
    },
    flags: {
      required: [Flags.OPERATOR_LIFECYCLE_MANAGER],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'OperatorBackedService',
      provider: catalogCSVProvider,
    },
    flags: {
      required: [Flags.OPERATOR_LIFECYCLE_MANAGER],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      id: 'operatorhub',
      section: 'operators',
      componentProps: {
        // t('olm~OperatorHub')
        name: '%olm~OperatorHub%',
        href: '/operatorhub',
      },
    },
    flags: {
      required: [FLAGS.CAN_LIST_PACKAGE_MANIFEST, FLAGS.CAN_LIST_OPERATOR_GROUP],
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      id: 'operators',
      section: 'operators',
      componentProps: {
        // t('olm~Installed Operators')
        name: '%olm~Installed Operators%',
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
        (
          await import(
            './components/operand/create-operand' /* webpackChunkName: "create-operand" */
          )
        ).CreateOperandPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${models.ClusterServiceVersionModel.plural}/:appName/:plural/~new`,
      loader: async () =>
        (
          await import(
            './components/operand/create-operand' /* webpackChunkName: "create-operand" */
          )
        ).CreateOperandPage,
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
        ).ClusterServiceVersionsDetailsPage,
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
      path: '/operatorhub/all-namespaces',
      loader: async () =>
        (
          await import(
            './components/operator-hub/operator-hub-page' /* webpackChunkName: "operator-hub" */
          )
        ).OperatorHubPage,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/operatorhub/ns/:ns',
      loader: async () =>
        (
          await import(
            './components/operator-hub/operator-hub-page' /* webpackChunkName: "operator-hub" */
          )
        ).OperatorHubPage,
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
  {
    type: 'Dashboards/Overview/Health/Operator',
    properties: {
      title: 'Operators',
      resources: [
        {
          kind: referenceForModel(models.ClusterServiceVersionModel),
          isList: true,
          prop: 'clusterServiceVersions',
        },
        {
          kind: referenceForModel(models.SubscriptionModel),
          prop: 'subscriptions',
          isList: true,
        },
      ],
      getOperatorsWithStatuses: getClusterServiceVersionsWithStatuses,
      operatorRowLoader: async () =>
        (
          await import(
            './components/dashboard/csv-status' /* webpackChunkName: "csv-dashboard-status" */
          )
        ).default,
    },
    flags: {
      required: [FLAGS.CAN_LIST_OPERATOR_GROUP],
    },
  },
];

export default plugin;
