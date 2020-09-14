import { TourDataType } from '@console/app/src/components/tour';
import {
  perspectiveSwitcherTourText,
  searchTourText,
  finishTourText,
  devPerspectiveTourText,
} from './GuidedTourText';

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

export const getGuidedTour = (): TourDataType => ({
  intro: {
    heading: 'Welcome to Dev Perspective!',
    content: devPerspectiveTourText,
  },
  steps: [
    {
      placement: 'right',
      heading: 'Perspective Switcher',
      content: perspectiveSwitcherTourText,
      selector: getSelector('tour-perspective-dropdown'),
    },
    {
      placement: 'right',
      heading: 'Monitoring',
      content: `Monitor application metrics, create custom metrics queries and view and silence alerts in your project.`,
      selector: getSelector('tour-monitoring-nav'),
    },
    {
      placement: 'right',
      heading: 'Search',
      content: searchTourText,
      selector: getSelector('tour-search-nav'),
    },
    {
      flags: ['DEVWORKSPACE'],
      placement: 'bottom',
      heading: 'Web Terminal',
      content: `Use command line tools directly from the Console. CLIs are pre-installed and fully authenticated when you need them.`,
      selector: getSelector('tour-cloud-shell-button'),
    },
    {
      placement: 'bottom',
      heading: 'Help',
      content: `Restart this tour or access our new quick starts where you can learn more about creating or deploying an application using OpenShift Developer Console.`,
      selector: getSelector('tour-help-button'),
    },
  ],
  end: {
    heading: 'You’re ready to go!',
    content: finishTourText,
  },
});
