import '@console/internal/i18n.js';
import '@console/shared/src/index.ts'; // this import is load bearing in development?!?!
import { GuidedTour, Plugin } from '@console/plugin-sdk';
import { getGuidedTour } from './components/guided-tour';

const plugin: Plugin<GuidedTour> = [
  {
    type: 'GuidedTour',
    properties: {
      perspective: 'admin',
      tour: getGuidedTour(),
    },
  },
];

export default plugin;
