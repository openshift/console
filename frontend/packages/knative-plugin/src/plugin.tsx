import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ModelFeatureFlag,
  ModelDefinition,
  OverviewResourceTab,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  GlobalConfig,
  KebabActions,
  YAMLTemplate,
  HrefNavItem,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { AddAction } from '@console/dev-console/src/extensions/add-actions';
import * as models from './models';
import { yamlTemplates } from './yaml-templates';
import {
  FLAG_KNATIVE_SERVING_CONFIGURATION,
  FLAG_KNATIVE_SERVING,
  FLAG_KNATIVE_SERVING_REVISION,
  FLAG_KNATIVE_SERVING_ROUTE,
  FLAG_KNATIVE_SERVING_SERVICE,
  FLAG_KNATIVE_EVENTING,
} from './const';
import { getKebabActionsForKind } from './utils/kebab-actions';
import { TopologyConsumedExtensions, topologyPlugin } from './topology/topology-plugin';
import * as eventSourceIcon from './imgs/event-source.svg';
import * as channelIcon from './imgs/channel.svg';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ModelFeatureFlag
  | ModelDefinition
  | GlobalConfig
  | OverviewResourceTab
  | ResourceListPage
  | RoutePage
  | KebabActions
  | HrefNavItem
  | YAMLTemplate
  | ResourceDetailsPage
  | AddAction
  | TopologyConsumedExtensions;

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
    type: 'GlobalConfig',
    properties: {
      kind: 'KnativeServing',
      model: models.KnativeServingModel,
      name: 'knative-serving',
      namespace: 'knative-serving',
      uid: 'knative-serving',
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING],
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'admin',
      section: 'Serverless',
      componentProps: {
        name: 'Serving',
        href: '/serving',
      },
    },
    flags: {
      required: [
        FLAG_KNATIVE_SERVING_SERVICE,
        FLAG_KNATIVE_SERVING_REVISION,
        FLAG_KNATIVE_SERVING_ROUTE,
      ],
    },
  },
  {
    type: 'Overview/Resource',
    properties: {
      name: 'Resources',
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
      path: ['/event-source/all-namespaces', '/event-source/ns/:ns'],
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
    type: 'YAMLTemplate',
    properties: {
      model: models.ServiceModel,
      template: yamlTemplates.getIn([models.ServiceModel, 'default']),
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
      required: [FLAG_KNATIVE_EVENTING],
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
      required: [FLAG_KNATIVE_EVENTING],
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
    type: 'KebabActions',
    properties: {
      getKebabActionsForKind,
    },
  },
  {
    type: 'AddAction',
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
    properties: {
      id: 'knative-event-source',
      url: '/event-source',
      label: 'Event Source',
      description:
        'Create an event source to register interest in a class of events from a particular system',
      icon: eventSourceIcon,
    },
  },
  {
    type: 'AddAction',
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
    properties: {
      id: 'knative-eventing-channel',
      url: '/channel',
      label: 'Channel',
      description:
        'Create a Knative Channel to create an event forwarding and persistence layer with in-memory and reliable implementations',
      icon: channelIcon,
    },
  },
  ...topologyPlugin,
];

export default plugin;
