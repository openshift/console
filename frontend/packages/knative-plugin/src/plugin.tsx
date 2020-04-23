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
  GlobalConfig,
  KebabActions,
  YAMLTemplate,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
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
} from './const';
import {
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
  knativeServingResourcesRoutes,
  knativeServingResourcesServices,
  eventSourceResourcesCronJob,
  eventSourceResourcesContainer,
  eventSourceResourcesApiServer,
  eventSourceResourcesCamel,
  eventSourceResourcesKafka,
} from './utils/create-knative-utils';
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
} from './utils/get-knative-resources';
import { getKebabActionsForKind } from './utils/kebab-actions';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ModelFeatureFlag
  | ModelDefinition
  | GlobalConfig
  | OverviewResourceTab
  | OverviewCRD
  | ResourceListPage
  | KebabActions
  | YAMLTemplate
  | ResourceDetailsPage;

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
        required: FLAG_KNATIVE_SERVING_SERVICE,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RevisionModel.labelPlural,
        resource: referenceForModel(models.RevisionModel),
        required: FLAG_KNATIVE_SERVING_REVISION,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RouteModel.labelPlural,
        resource: referenceForModel(models.RouteModel),
        required: FLAG_KNATIVE_SERVING_ROUTE,
      },
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
    type: 'Page/Resource/List',
    properties: {
      model: models.RevisionModel,
      loader: async () =>
        (await import(
          './components/revisions/RevisionsPage' /* webpackChunkName: "knative-revisions-page" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.ServiceModel,
      loader: async () =>
        (await import(
          './components/services/ServicesPage' /* webpackChunkName: "knative-services-page" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.RouteModel,
      loader: async () =>
        (await import(
          './components/routes/RoutesPage' /* webpackChunkName: "knative-routes-page" */
        )).default,
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
];

export default plugin;
