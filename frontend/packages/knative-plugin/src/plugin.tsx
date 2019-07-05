import * as _ from 'lodash';
import { Plugin, ResourceNSNavItem, ModelFeatureFlag, ModelDefinition } from '@console/plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import * as models from './models';
import { FLAG_KNATIVE_SERVING } from './const';

type ConsumedExtensions = ResourceNSNavItem | ModelFeatureFlag | ModelDefinition;

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
];

export default plugin;
