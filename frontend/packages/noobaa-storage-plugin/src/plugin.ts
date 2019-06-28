import * as _ from 'lodash';

import { Plugin, ModelFeatureFlag, ModelDefinition } from '@console/plugin-sdk';

import * as models from './models';

type ConsumedExtensions = ModelFeatureFlag | ModelDefinition;

const NOOBAA_FLAG = 'NOOBAA';

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
      model: models.NooBaaSystemModel,
      flag: NOOBAA_FLAG,
    },
  },
];

export default plugin;
