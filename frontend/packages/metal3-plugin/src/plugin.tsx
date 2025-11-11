import '@console/internal/i18n.js';
import { Plugin, CustomFeatureFlag } from '@console/plugin-sdk';
import { detectBaremetalPlatform, detectBMOEnabled } from './features';

type ConsumedExtensions = CustomFeatureFlag;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectBaremetalPlatform,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectBMOEnabled,
    },
  },
];

export default plugin;
