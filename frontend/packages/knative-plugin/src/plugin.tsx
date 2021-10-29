import * as _ from 'lodash';
import {
  Plugin,
  ModelDefinition,
  OverviewResourceTab,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  KebabActions,
  HorizontalNavTab,
  DetailPageBreadCrumbs,
} from '@console/plugin-sdk';
import { FLAG_KNATIVE_SERVING_SERVICE, FLAG_KNATIVE_EVENTING } from './const';
import * as models from './models';
import {
  eventSourceBreadcrumbsProvider,
  channelBreadcrumbsProvider,
  brokerBreadcrumbsProvider,
  eventSourceModelsProviderForBreadcrumbs,
  channelModelsProviderForBreadcrumbs,
  brokerModelProviderForBreadcrumbs,
} from './providers';
import { TopologyConsumedExtensions, topologyPlugin } from './topology/topology-plugin';
import { getKebabActionsForKind, getKebabActionsForWorkload } from './utils/kebab-actions';

type ConsumedExtensions =
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
    flags: {
      required: [FLAG_KNATIVE_SERVING_SERVICE],
    },
  },
  {
    type: 'KebabActions',
    properties: {
      getKebabActionsForKind,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
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
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: eventSourceModelsProviderForBreadcrumbs,
      breadcrumbsProvider: eventSourceBreadcrumbsProvider,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: channelModelsProviderForBreadcrumbs,
      breadcrumbsProvider: channelBreadcrumbsProvider,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: brokerModelProviderForBreadcrumbs,
      breadcrumbsProvider: brokerBreadcrumbsProvider,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  ...topologyPlugin,
];

export default plugin;
