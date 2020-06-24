import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ModelFeatureFlag,
  ModelDefinition,
  OverviewResourceTab,
  OverviewCRD,
  OverviewResourceUtil,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  GlobalConfig,
  KebabActions,
  YAMLTemplate,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { referenceForModel } from '@console/internal/module/k8s';
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
import {
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
  knativeServingResourcesRoutes,
  knativeServingResourcesServices,
  getKnativeServingRevisions,
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
  getKnativeServingServices,
} from './utils/get-knative-resources';
import { getKebabActionsForKind } from './utils/kebab-actions';
import {
  fetchEventSourcesCrd,
  getDynamicEventSourcesResourceList,
  hideDynamicEventSourceCard,
} from './utils/fetch-dynamic-eventsources-utils';
import { TopologyConsumedExtensions, topologyPlugin } from './topology/topology-plugin';
import * as eventSourceIcon from './imgs/event-source.svg';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ModelFeatureFlag
  | ModelDefinition
  | GlobalConfig
  | OverviewResourceTab
  | OverviewCRD
  | OverviewResourceUtil
  | ResourceListPage
  | RoutePage
  | KebabActions
  | YAMLTemplate
  | ResourceDetailsPage
  | AddAction
  | TopologyConsumedExtensions;

// Added it to perform discovery of Dynamic event sources on cluster on app load as kebab option needed models upfront
fetchEventSourcesCrd();

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
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.ServiceModel.labelPlural,
        resource: referenceForModel(models.ServiceModel),
      },
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_SERVICE],
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RevisionModel.labelPlural,
        resource: referenceForModel(models.RevisionModel),
      },
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_REVISION],
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RouteModel.labelPlural,
        resource: referenceForModel(models.RouteModel),
      },
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_ROUTE],
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
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResourcesRevision,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_REVISION],
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResourcesConfigurations,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_CONFIGURATION],
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResourcesRoutes,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_ROUTE],
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResourcesServices,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_REVISION],
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: getDynamicEventSourcesResourceList,
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingRevisions,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_REVISION],
    },
  },
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingConfigurations,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_CONFIGURATION],
    },
  },
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingRoutes,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_ROUTE],
    },
  },
  {
    type: 'Overview/ResourceUtil',
    properties: {
      getResources: getKnativeServingServices,
    },
    flags: {
      required: [FLAG_KNATIVE_SERVING_SERVICE],
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
            './components/revisions/RevisionDetailsPage' /* webpackChunkName: "knative-revisions-details page" */
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
      hide: hideDynamicEventSourceCard,
    },
  },
  ...topologyPlugin,
];

export default plugin;
