import * as _ from 'lodash';
import { Plugin, ModelDefinition, ModelFeatureFlag } from '@console/plugin-sdk';
import { defaultDecoratorsPlugin } from './components/graph-view/components/nodes/decorators/defaultDecoratorsPlugin';
import { TopologyDecoratorProvider } from './extensions';
import * as models from './models';
import {
  OperatorsTopologyConsumedExtensions,
  operatorsTopologyPlugin,
} from './operators/operatorsTopologyPlugin';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | TopologyDecoratorProvider
  | OperatorsTopologyConsumedExtensions;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  ...operatorsTopologyPlugin,
  ...defaultDecoratorsPlugin,
];

export default plugin;
