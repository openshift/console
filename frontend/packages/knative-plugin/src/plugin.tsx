import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ModelFeatureFlag,
  ModelDefinition,
  OverviewResourceTab,
  OverviewCRD,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  GlobalConfig,
  ResourceActionProvider,
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
  FLAG_EVENT_SOURCE_CRONJOB,
  FLAG_EVENT_SOURCE_CONTAINER,
  FLAG_EVENT_SOURCE_APISERVER,
  FLAG_EVENT_SOURCE_CAMEL,
  FLAG_EVENT_SOURCE_KAFKA,
  FLAG_EVENT_SOURCE_SINKBINDING,
  FLAG_KNATIVE_EVENTING,
} from './const';
import {
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
  getKnativeServingRevisions,
  getKnativeServingServices,
  getEventSourceCronjob,
  getEventSourceContainer,
  getEventSourceApiserver,
  getEventSourceCamel,
  getEventSourceKafka,
  getEventSourceSinkBinding,
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
  knativeServingResourcesRoutes,
  knativeServingResourcesServices,
  eventSourceResourcesCronJob,
  eventSourceResourcesContainer,
  eventSourceResourcesApiServer,
  eventSourceResourcesCamel,
  eventSourceResourcesKafka,
  eventSourceResourcesSinkBinding,
} from './utils/get-knative-resources';
import { getResourceActions } from './utils/resource-actions';
import { fetchEventSourcesCrd } from './utils/fetch-dynamic-eventsources-utils';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ModelFeatureFlag
  | ModelDefinition
  | GlobalConfig
  | OverviewResourceTab
  | OverviewCRD
  | ResourceListPage
  | RoutePage
  | ResourceActionProvider
  | YAMLTemplate
  | ResourceDetailsPage
  | AddAction;

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
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventSourceCronJobModel,
      flag: FLAG_EVENT_SOURCE_CRONJOB,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventSourceContainerModel,
      flag: FLAG_EVENT_SOURCE_CONTAINER,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventSourceApiServerModel,
      flag: FLAG_EVENT_SOURCE_APISERVER,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventSourceCamelModel,
      flag: FLAG_EVENT_SOURCE_CAMEL,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventSourceKafkaModel,
      flag: FLAG_EVENT_SOURCE_KAFKA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.EventSourceSinkBindingModel,
      flag: FLAG_EVENT_SOURCE_SINKBINDING,
    },
  },
  {
    type: 'GlobalConfig',
    properties: {
      kind: 'KnativeServing',
      model: models.KnativeServingModel,
      name: 'knative-serving',
      namespace: 'knative-serving',
      required: FLAG_KNATIVE_SERVING,
      uid: 'knative-serving',
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
      required: FLAG_KNATIVE_SERVING_REVISION,
      utils: getKnativeServingRevisions,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResourcesConfigurations,
      required: FLAG_KNATIVE_SERVING_CONFIGURATION,
      utils: getKnativeServingConfigurations,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResourcesRoutes,
      required: FLAG_KNATIVE_SERVING_ROUTE,
      utils: getKnativeServingRoutes,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResourcesServices,
      required: FLAG_KNATIVE_SERVING_SERVICE,
      utils: getKnativeServingServices,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: eventSourceResourcesCronJob,
      required: FLAG_EVENT_SOURCE_CRONJOB,
      utils: getEventSourceCronjob,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: eventSourceResourcesContainer,
      required: FLAG_EVENT_SOURCE_CONTAINER,
      utils: getEventSourceContainer,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: eventSourceResourcesApiServer,
      required: FLAG_EVENT_SOURCE_APISERVER,
      utils: getEventSourceApiserver,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: eventSourceResourcesCamel,
      required: FLAG_EVENT_SOURCE_CAMEL,
      utils: getEventSourceCamel,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: eventSourceResourcesKafka,
      required: FLAG_EVENT_SOURCE_KAFKA,
      utils: getEventSourceKafka,
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: eventSourceResourcesSinkBinding,
      required: FLAG_EVENT_SOURCE_SINKBINDING,
      utils: getEventSourceSinkBinding,
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
      model: models.ServiceModel,
      loader: async () =>
        (
          await import(
            './components/services/ServiceDetailsPage' /* webpackChunkName: "knative-service-details-page" */
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
    type: 'Page/Resource/Details',
    properties: {
      model: models.RouteModel,
      loader: async () =>
        (
          await import(
            './components/routes/RouteDetailsPage' /* webpackChunkName: "knative-route-details-page" */
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
      required: FLAG_KNATIVE_EVENTING,
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
      required: FLAG_KNATIVE_EVENTING,
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
    type: 'Resource/Actions',
    properties: {
      getResourceActions,
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
      description: 'Create an event source and sink it to Knative service',
      iconClass: 'pficon-help',
    },
  },
];

export default plugin;
