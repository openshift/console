import * as _ from 'lodash';
import {
  Plugin,
  ModelFeatureFlag,
  ModelDefinition,
  OverviewResourceTab,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  KebabActions,
  HorizontalNavTab,
  DetailPageBreadCrumbs,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import * as models from './models';
import {
  FLAG_KNATIVE_SERVING_CONFIGURATION,
  FLAG_KNATIVE_SERVING,
  FLAG_KNATIVE_SERVING_REVISION,
  FLAG_KNATIVE_SERVING_ROUTE,
  FLAG_KNATIVE_SERVING_SERVICE,
  FLAG_KNATIVE_EVENTING,
  FLAG_KNATIVE_EVENTING_CHANNEL,
  FLAG_KNATIVE_EVENTING_BROKER,
  FLAG_CAMEL_KAMELETS,
} from './const';
import { getKebabActionsForKind, getKebabActionsForWorkload } from './utils/kebab-actions';
import { TopologyConsumedExtensions, topologyPlugin } from './topology/topology-plugin';

import {
  eventSourceBreadcrumbsProvider,
  channelBreadcrumbsProvider,
  brokerBreadcrumbsProvider,
  eventSourceModelsProviderForBreadcrumbs,
  channelModelsProviderForBreadcrumbs,
  brokerModelProviderForBreadcrumbs,
} from './providers';

type ConsumedExtensions =
  | ModelFeatureFlag
  | ModelDefinition
  | OverviewResourceTab
  | ResourceListPage
  | RoutePage
  | KebabActions
  | ResourceDetailsPage
  | TopologyConsumedExtensions
  | HorizontalNavTab
  | DetailPageBreadCrumbs;

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
      model: models.ConfigurationModel,
      flag: FLAG_KNATIVE_SERVING_CONFIGURATION,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.KnativeServingModel,
      flag: FLAG_KNATIVE_SERVING,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.KnativeEventingModel,
      flag: FLAG_KNATIVE_EVENTING,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.RevisionModel,
      flag: FLAG_KNATIVE_SERVING_REVISION,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.RouteModel,
      flag: FLAG_KNATIVE_SERVING_ROUTE,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.ServiceModel,
      flag: FLAG_KNATIVE_SERVING_SERVICE,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventingBrokerModel,
      flag: FLAG_KNATIVE_EVENTING_BROKER,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventingChannelModel,
      flag: FLAG_KNATIVE_EVENTING_CHANNEL,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.CamelKameletModel,
      flag: FLAG_CAMEL_KAMELETS,
    },
  },
  {
    type: 'Overview/Resource',
    properties: {
      // t('knative-plugin~Resources')
      name: '%knative-plugin~Resources%',
      key: 'configurations',
      loader: () =>
        import(
          './components/overview/OverviewDetailsKnativeResourcesTab' /* webpackChunkName: "knative-overview" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.RevisionModel,
      loader: async () =>
        (
          await import(
            './components/revisions/RevisionsPage' /* webpackChunkName: "knative-revisions-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.RevisionModel,
      loader: async () =>
        (
          await import(
            './components/revisions/RevisionDetailsPage' /* webpackChunkName: "revision-details-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.RouteModel,
      loader: async () =>
        (
          await import(
            './components/routes/RouteDetailsPage' /* webpackChunkName: "route-details-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.ServiceModel,
      loader: async () =>
        (
          await import(
            './components/services/ServiceDetailsPage' /* webpackChunkName: "service-details-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.KnativeServingModel,
      loader: async () =>
        (
          await import(
            './components/overview/KnativeServingDetailsPage' /* webpackChunkName: "knative-serving-details-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.ServiceModel,
      loader: async () =>
        (
          await import(
            './components/services/ServicesPage' /* webpackChunkName: "knative-services-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.EventingTriggerModel,
      loader: async () =>
        (
          await import(
            './components/pub-sub/details/TriggerDetailsPage' /* webpackChunkName: "trigger-details-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.EventingSubscriptionModel,
      loader: async () =>
        (
          await import(
            './components/pub-sub/details/SubscriptionDetailsPage' /* webpackChunkName: "subscription-details-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.RouteModel,
      loader: async () =>
        (
          await import(
            './components/routes/RoutesPage' /* webpackChunkName: "knative-routes-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/event-source'],
      component: NamespaceRedirect,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/catalog/all-namespaces/eventsource', '/catalog/ns/:ns/eventsource'],
      loader: async () =>
        (
          await import(
            './components/add/EventSourcePage' /* webpackChunkName: "knative-event-source-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/channel'],
      component: NamespaceRedirect,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING, FLAG_KNATIVE_EVENTING_CHANNEL],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/channel/all-namespaces', '/channel/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/add/EventingChannelPage' /* webpackChunkName: "knative-eventing-channel-page" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING, FLAG_KNATIVE_EVENTING_CHANNEL],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/serving'],
      component: NamespaceRedirect,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/serving/all-namespaces', '/serving/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/overview/serving-list/ServingListsPage' /* webpackChunkName: "serving-list-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/eventing'],
      component: NamespaceRedirect,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: false,
      path: ['/eventing/all-namespaces', '/eventing/ns/:ns'],
      loader: async () =>
        (
          await import(
            './components/eventing/EventingListPage' /* webpackChunkName: "eventing-list-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: '/knatify/ns/:ns',
      loader: async () =>
        (
          await import(
            './components/knatify/CreateKnatifyPage' /* webpackChunkName: "knatify-create" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_SERVICE],
    },
  },
  {
    type: 'KebabActions',
    properties: {
      getKebabActionsForKind,
    },
  },
  {
    type: 'KebabActions',
    flags: {
      required: [FLAG_KNATIVE_SERVING_SERVICE],
    },
    properties: {
      getKebabActionsForKind: getKebabActionsForWorkload,
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: models.EventingBrokerModel,
      page: {
        // t('knative-plugin~Triggers')
        name: '%knative-plugin~Triggers%',
        href: 'triggers',
      },
      loader: async () =>
        (
          await import(
            './components/eventing/BrokerTriggerTab' /* webpackChunkName: "knative-broker-triggers-list" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: models.EventingChannelModel,
      page: {
        // t('knative-plugin~Subscriptions')
        name: '%knative-plugin~Subscriptions%',
        href: 'subscriptions',
      },
      loader: async () =>
        (
          await import(
            './components/eventing/ChannelSubscriptionTab' /* webpackChunkName: "knative-channel-subscription-list" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: models.EventingKafkaChannelModel,
      page: {
        // t('knative-plugin~Subscriptions')
        name: '%knative-plugin~Subscriptions%',
        href: 'subscriptions',
      },
      loader: async () =>
        (
          await import(
            './components/eventing/ChannelSubscriptionTab' /* webpackChunkName: "knative-channel-subscription-list" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: models.EventingIMCModel,
      page: {
        // t('knative-plugin~Subscriptions')
        name: '%knative-plugin~Subscriptions%',
        href: 'subscriptions',
      },
      loader: async () =>
        (
          await import(
            './components/eventing/ChannelSubscriptionTab' /* webpackChunkName: "knative-channel-subscription-list" */
          )
        ).default,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.EventingSubscriptionModel,
      loader: async () =>
        (
          await import(
            './components/eventing/subscription-list/SubscriptionListPage' /* webpackChunkName: "knative-subscription-page" */
          )
        ).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.EventingTriggerModel,
      loader: async () =>
        (
          await import(
            './components/eventing/triggers-list/TriggerListPage' /* webpackChunkName: "knative-triggers-page" */
          )
        ).default,
    },
  },
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: eventSourceModelsProviderForBreadcrumbs,
      breadcrumbsProvider: eventSourceBreadcrumbsProvider,
    },
  },
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: channelModelsProviderForBreadcrumbs,
      breadcrumbsProvider: channelBreadcrumbsProvider,
    },
  },
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: brokerModelProviderForBreadcrumbs,
      breadcrumbsProvider: brokerBreadcrumbsProvider,
    },
  },
  ...topologyPlugin,
];

export default plugin;
