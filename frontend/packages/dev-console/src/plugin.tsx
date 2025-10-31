import { GuidedTour, Plugin } from '@console/plugin-sdk';
import { getGuidedTour } from './components/guided-tour';

type ConsumedExtensions = GuidedTour;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'GuidedTour',
    properties: {
      perspective: 'dev',
      tour: getGuidedTour(),
    },
  },
];

export default plugin;
