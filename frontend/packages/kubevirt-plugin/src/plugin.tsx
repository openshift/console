import { Plugin } from '@console/plugin-sdk';
import { getTopologyPlugin, TopologyConsumedExtensions } from './topology/topology-plugin';

import '@console/internal/i18n.js';
import './style.scss';

type ConsumedExtensions = TopologyConsumedExtensions;

export const FLAG_KUBEVIRT = 'KUBEVIRT';

const plugin: Plugin<ConsumedExtensions> = [...getTopologyPlugin([FLAG_KUBEVIRT])];

export default plugin;
