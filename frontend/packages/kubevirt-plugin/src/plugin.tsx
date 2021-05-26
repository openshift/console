import * as _ from 'lodash';
import { Plugin, ModelDefinition } from '@console/plugin-sdk';
import * as models from './models';
import { getTopologyPlugin, TopologyConsumedExtensions } from './topology/topology-plugin';

import '@console/internal/i18n.js';
import './style.scss';

type ConsumedExtensions = ModelDefinition | TopologyConsumedExtensions;

export const FLAG_KUBEVIRT = 'KUBEVIRT';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  ...getTopologyPlugin([FLAG_KUBEVIRT]),
];

export default plugin;
