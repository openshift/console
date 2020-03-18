import * as _ from 'lodash';
import { ModelDefinition, ModelFeatureFlag, Plugin } from '@console/plugin-sdk';
import * as models from './models';

type ConsumedExtensions = ModelFeatureFlag | ModelDefinition;

const LSO_FLAG = 'LSO';

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
      model: models.LocalVolumeModel,
      flag: LSO_FLAG,
    },
  },
];

export default plugin;
