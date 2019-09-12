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
  YAMLTemplate,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';
import { yamlTemplatesAlpha, yamlTemplatesBeta } from './yaml-templates';
import {
  FLAG_KNATIVE_SERVING_CONFIGURATION_ALPHA,
  FLAG_KNATIVE_SERVING_ALPHA,
  FLAG_KNATIVE_SERVING_REVISION_ALPHA,
  FLAG_KNATIVE_SERVING_ROUTE_ALPHA,
  FLAG_KNATIVE_SERVING_SERVICE_ALPHA,
  FLAG_KNATIVE_SERVING_CONFIGURATION_BETA,
  FLAG_KNATIVE_SERVING_BETA,
  FLAG_KNATIVE_SERVING_REVISION_BETA,
  FLAG_KNATIVE_SERVING_ROUTE_BETA,
  FLAG_KNATIVE_SERVING_SERVICE_BETA,
} from './const';
import { knativeServingResources } from './utils/create-knative-utils';
import { getKnativeServingResources } from './utils/get-knative-resources';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ModelFeatureFlag
  | ModelDefinition
  | GlobalConfig
  | OverviewResourceTab
  | OverviewCRD
  | ResourceListPage
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
      model: models.ConfigurationModelAlpha,
      flag: FLAG_KNATIVE_SERVING_CONFIGURATION_ALPHA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.KnativeServingModelAlpha,
      flag: FLAG_KNATIVE_SERVING_ALPHA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.RevisionModelAlpha,
      flag: FLAG_KNATIVE_SERVING_REVISION_ALPHA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.RouteModelAlpha,
      flag: FLAG_KNATIVE_SERVING_ROUTE_ALPHA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.ServiceModelAlpha,
      flag: FLAG_KNATIVE_SERVING_SERVICE_ALPHA,
    },
  },
  {
    type: 'GlobalConfig',
    properties: {
      kind: 'KnativeServing',
      model: models.KnativeServingModelAlpha,
      name: 'knative-serving',
      namespace: 'knative-serving',
      required: FLAG_KNATIVE_SERVING_ALPHA,
      uid: 'knative-serving',
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.ServiceModelAlpha.labelPlural,
        resource: referenceForModel(models.ServiceModelAlpha),
        required: FLAG_KNATIVE_SERVING_SERVICE_ALPHA,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RevisionModelAlpha.labelPlural,
        resource: referenceForModel(models.RevisionModelAlpha),
        required: FLAG_KNATIVE_SERVING_REVISION_ALPHA,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RouteModelAlpha.labelPlural,
        resource: referenceForModel(models.RouteModelAlpha),
        required: FLAG_KNATIVE_SERVING_ROUTE_ALPHA,
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
        ).then((m) => m.OverviewDetailsKnativeResourcesTabAlpha),
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResources,
      required: FLAG_KNATIVE_SERVING_ALPHA,
      utils: getKnativeServingResources,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.RevisionModelAlpha,
      loader: async () =>
        (await import(
          './components/revisions/RevisionsPage' /* webpackChunkName: "knative-revisions-page" */
        )).RevisionsPageAlpha,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.RevisionModelAlpha,
      loader: async () =>
        (await import(
          './components/revisions/RevisionDetailsPage' /* webpackChunkName: "knative-revision-details-page" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.ServiceModelAlpha,
      loader: async () =>
        (await import(
          './components/services/ServicesPage' /* webpackChunkName: "knative-services-page" */
        )).ServicesPageAlpha,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.ServiceModelAlpha,
      loader: async () =>
        (await import(
          './components/services/ServiceDetailsPage' /* webpackChunkName: "knative-service-details-page" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.RouteModelAlpha,
      loader: async () =>
        (await import(
          './components/routes/RoutesPage' /* webpackChunkName: "knative-routes-page" */
        )).RoutesPageAlpha,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.RouteModelAlpha,
      loader: async () =>
        (await import(
          './components/routes/RouteDetailsPage' /* webpackChunkName: "knative-route-details-page" */
        )).default,
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.ServiceModelAlpha,
      template: yamlTemplatesAlpha.getIn([models.ServiceModelAlpha, 'default']),
    },
  },
  // Beta plugins
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.ConfigurationModelBeta,
      flag: FLAG_KNATIVE_SERVING_CONFIGURATION_BETA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.KnativeServingModelBeta,
      flag: FLAG_KNATIVE_SERVING_BETA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.RevisionModelBeta,
      flag: FLAG_KNATIVE_SERVING_REVISION_BETA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.RouteModelBeta,
      flag: FLAG_KNATIVE_SERVING_ROUTE_BETA,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.ServiceModelBeta,
      flag: FLAG_KNATIVE_SERVING_SERVICE_BETA,
    },
  },
  {
    type: 'GlobalConfig',
    properties: {
      kind: 'KnativeServing',
      model: models.KnativeServingModelBeta,
      name: 'knative-serving',
      namespace: 'knative-serving',
      required: FLAG_KNATIVE_SERVING_BETA,
      uid: 'knative-serving',
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.ServiceModelBeta.labelPlural,
        resource: referenceForModel(models.ServiceModelBeta),
        required: FLAG_KNATIVE_SERVING_SERVICE_BETA,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RevisionModelBeta.labelPlural,
        resource: referenceForModel(models.RevisionModelBeta),
        required: FLAG_KNATIVE_SERVING_REVISION_BETA,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.RouteModelBeta.labelPlural,
        resource: referenceForModel(models.RouteModelBeta),
        required: FLAG_KNATIVE_SERVING_ROUTE_BETA,
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
        ).then((m) => m.OverviewDetailsKnativeResourcesTabBeta),
    },
  },
  {
    type: 'Overview/CRD',
    properties: {
      resources: knativeServingResources,
      required: FLAG_KNATIVE_SERVING_BETA,
      utils: getKnativeServingResources,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.RevisionModelBeta,
      loader: async () =>
        (await import(
          './components/revisions/RevisionsPage' /* webpackChunkName: "knative-revisions-page" */
        )).RevisionsPageBeta,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.RevisionModelBeta,
      loader: async () =>
        (await import(
          './components/revisions/RevisionDetailsPage' /* webpackChunkName: "knative-revision-details-page" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.ServiceModelBeta,
      loader: async () =>
        (await import(
          './components/services/ServicesPage' /* webpackChunkName: "knative-services-page" */
        )).ServicesPageBeta,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.ServiceModelBeta,
      loader: async () =>
        (await import(
          './components/services/ServiceDetailsPage' /* webpackChunkName: "knative-service-details-page" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.RouteModelBeta,
      loader: async () =>
        (await import(
          './components/routes/RoutesPage' /* webpackChunkName: "knative-routes-page" */
        )).RoutesPageBeta,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.RouteModelBeta,
      loader: async () =>
        (await import(
          './components/routes/RouteDetailsPage' /* webpackChunkName: "knative-route-details-page" */
        )).default,
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.ServiceModelBeta,
      template: yamlTemplatesBeta.getIn([models.ServiceModelBeta, 'default']),
    },
  },
];

export default plugin;
