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
    // t('devconsole~Welcome to the Developer Perspective!')
    heading: '%devconsole~Welcome to the Developer Perspective!%',
    content: devPerspectiveTourText,
  },
  steps: [
    {
      placement: 'right',
      // t('devconsole~Perspective Switcher')
      heading: '%devconsole~Perspective Switcher%',
      content: perspectiveSwitcherTourText,
      selector: getSelector('tour-perspective-dropdown'),
    },
    {
      placement: 'right',
      // t('devconsole~Observe')
      heading: '%devconsole~Observe%',
      // t('devconsole~Monitor application metrics, create custom metrics queries and view and silence alerts in your project.')
      content:
        '%devconsole~Monitor application metrics, create custom metrics queries and view and silence alerts in your project.%',
      selector: getSelector('tour-monitoring-nav'),
    },
    {
      placement: 'right',
      // t('devconsole~Search')
      heading: '%devconsole~Search%',
      content: searchTourText,
      selector: getSelector('tour-search-nav'),
    },
    {
      flags: ['DEVWORKSPACE'],
      placement: 'bottom',
      // t('devconsole~Web Terminal')
      heading: '%devconsole~Web Terminal%',
      // t('devconsole~Use command line tools directly from the Console. CLIs are pre-installed and fully authenticated when you need them.')
      content:
        '%devconsole~Use command line tools directly from the Console. CLIs are pre-installed and fully authenticated when you need them.%',
      selector: getSelector('tour-cloud-shell-button'),
    },
    {
      placement: 'bottom',
      // t('devconsole~Help')
      heading: '%devconsole~Help%',
      // t('devconsole~Restart this tour or access our new quick starts where you can learn more about creating or deploying an application using OpenShift Developer Console.')
      content:
        '%devconsole~Restart this tour or access our new quick starts where you can learn more about creating or deploying an application using OpenShift Developer Console.%',
      selector: getSelector('tour-help-button'),
    },
  ],
  end: {
    // t('devconsole~You’re ready to go!')
    heading: '%devconsole~You’re ready to go!%',
    content: finishTourText,
  },
});
