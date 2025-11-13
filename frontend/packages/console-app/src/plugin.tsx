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
