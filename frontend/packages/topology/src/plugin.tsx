import * as _ from 'lodash';
import { Plugin, ModelDefinition, ModelFeatureFlag } from '@console/plugin-sdk';
import {
  OperatorsTopologyConsumedExtensions,
  operatorsTopologyPlugin,
} from './operators/operatorsTopologyPlugin';
import * as models from './models';
import { ServiceBindingModel } from './models/service-binding';
import { ALLOW_SERVICE_BINDING_FLAG } from './const';
import { defaultDecoratorsPlugin } from './components/graph-view/components/nodes/decorators/defaultDecoratorsPlugin';
import { TopologyDecoratorProvider } from './extensions';

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
