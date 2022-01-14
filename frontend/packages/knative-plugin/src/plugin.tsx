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
import { FLAG_KNATIVE_EVENTING, FLAG_KNATIVE_SERVING_SERVICE } from './const';
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
