import { Plugin, ModelDefinition } from '@console/plugin-sdk';
import * as models from './models';

type ConsumedExtensions = ModelDefinition;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: Object.values(models),
    },
  },
];

export default plugin;
