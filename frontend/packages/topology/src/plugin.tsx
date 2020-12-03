import * as _ from 'lodash';
import { Plugin, ReduxReducer, ModelDefinition, ModelFeatureFlag } from '@console/plugin-sdk';
import {
  OperatorsTopologyConsumedExtensions,
  operatorsTopologyPlugin,
} from './operators/operatorsTopologyPlugin';
import reducer from './utils/reducer';
import * as models from './models';
import { ServiceBindingModel } from './models/service-binding';
import { ALLOW_SERVICE_BINDING_FLAG } from './const';

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | ReduxReducer
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
  {
    type: 'ReduxReducer',
    properties: {
      namespace: 'devconsole',
      reducer,
    },
  },
  ...operatorsTopologyPlugin,
];

export default plugin;
