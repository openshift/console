import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ModelFeatureFlag,
  ModelDefinition,
  OverviewResourceTab,
  OverviewCRD,
} from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';
import { FLAG_KNATIVE_SERVING } from './const';
import { knativeServingResources } from './utils/create-knative-utils';
import { getKnativeServingResources } from './utils/get-knative-resources';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ModelFeatureFlag
  | ModelDefinition
  | OverviewResourceTab
  | OverviewCRD;

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
      model: models.KnativeServingModel,
      flag: FLAG_KNATIVE_SERVING,
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.ServiceModel.labelPlural,
        resource: referenceForModel(models.ServiceModel),
        required: FLAG_KNATIVE_SERVING,
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
        required: FLAG_KNATIVE_SERVING,
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Serverless',
      componentProps: {
        name: models.ConfigurationModel.labelPlural,
        resource: referenceForModel(models.ConfigurationModel),
        required: FLAG_KNATIVE_SERVING,
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
      resources: knativeServingResources,
      required: FLAG_KNATIVE_SERVING,
      utils: getKnativeServingResources,
    },
  },
];

export default plugin;
