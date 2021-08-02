import * as _ from 'lodash';
import { ModelDefinition, Plugin } from '@console/plugin-sdk';
import * as models from './models';

type ConsumedExtensions = ModelDefinition;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
];

export default plugin;
