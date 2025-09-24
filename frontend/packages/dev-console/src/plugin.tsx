import { GuidedTour, Plugin, PostFormSubmissionAction } from '@console/plugin-sdk';
import { doConnectsToBinding } from '@console/topology/src/utils/connector-utils';
import { getGuidedTour } from './components/guided-tour';
import { INCONTEXT_ACTIONS_CONNECTS_TO } from './const';

type ConsumedExtensions = GuidedTour | PostFormSubmissionAction;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'GuidedTour',
    properties: {
      perspective: 'dev',
      tour: getGuidedTour(),
    },
  },
  {
    type: 'PostFormSubmissionAction',
    properties: {
      type: INCONTEXT_ACTIONS_CONNECTS_TO,
      callback: doConnectsToBinding,
    },
  },
];

export default plugin;
