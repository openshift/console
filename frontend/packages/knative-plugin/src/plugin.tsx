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
import { FLAG_KNATIVE_EVENTING } from './const';
import {
  eventSourceBreadcrumbsProvider,
  channelBreadcrumbsProvider,
  brokerBreadcrumbsProvider,
  eventSourceModelsProviderForBreadcrumbs,
  channelModelsProviderForBreadcrumbs,
  brokerModelProviderForBreadcrumbs,
} from './providers';
import { TopologyConsumedExtensions, topologyPlugin } from './topology/topology-plugin';

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
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: eventSourceModelsProviderForBreadcrumbs,
      breadcrumbsProvider: eventSourceBreadcrumbsProvider as any,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: channelModelsProviderForBreadcrumbs,
      breadcrumbsProvider: channelBreadcrumbsProvider as any,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: brokerModelProviderForBreadcrumbs,
      breadcrumbsProvider: brokerBreadcrumbsProvider as any,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  ...topologyPlugin,
];

export default plugin;
