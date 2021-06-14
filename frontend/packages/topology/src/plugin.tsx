import * as _ from 'lodash';
import { Plugin, ModelDefinition, ModelFeatureFlag } from '@console/plugin-sdk';
import { defaultDecoratorsPlugin } from './components/graph-view/components/nodes/decorators/defaultDecoratorsPlugin';
import { ALLOW_SERVICE_BINDING_FLAG } from './const';
import { TopologyDecoratorProvider } from './extensions';
import * as models from './models';
import { ServiceBindingModel } from './models/service-binding';
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
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: ServiceBindingModel,
      flag: ALLOW_SERVICE_BINDING_FLAG,
    },
  },
  ...operatorsTopologyPlugin,
  ...defaultDecoratorsPlugin,
];

export default plugin;
