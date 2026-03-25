import { ModalVariant } from '@patternfly/react-core';
import {
  finishTourText,
  helpTourText,
  userPreferencesTourText,
} from '@console/app/src/components/guided-tour/GuidedTourText';
import type { TourDataType } from '@console/app/src/components/tour';
import GuidedTourIntroBanner from './GuidedTourIntroBanner';
import GuidedTourIntroBannerDark from './GuidedTourIntroBannerDark';
import {
  perspectiveSwitcherTourText,
  searchTourText,
  devPerspectiveTourText,
  webTerminalGuidedTourText,
} from './GuidedTourText';

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

export const getGuidedTour = (): TourDataType => ({
  intro: {
    // t('devconsole~Welcome to the Developer Perspective!')
    heading: '%devconsole~Welcome to the Developer Perspective!%',
    content: devPerspectiveTourText,
    introBannerLight: <GuidedTourIntroBanner />,
    introBannerDark: <GuidedTourIntroBannerDark />,
    modalVariant: ModalVariant.medium,
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
      selector: getSelector('tour-software-catalog-nav'),
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
      content: webTerminalGuidedTourText,
      selector: getSelector('tour-cloud-shell-button'),
    },
    {
      placement: 'bottom',
      // t('devconsole~Help')
      heading: '%devconsole~Help%',
      content: helpTourText,
      selector: getSelector('tour-help-button'),
    },
    {
      placement: 'bottom',
      // t('devconsole~User Preferences')
      heading: '%devconsole~User Preferences%',
      content: userPreferencesTourText,
      selector: getSelector('tour-user-button'),
    },
  ],
  end: {
    // t('devconsole~You’re ready to go!')
    heading: '%devconsole~You’re ready to go!%',
    content: finishTourText,
    introBannerLight: <GuidedTourIntroBanner />,
    introBannerDark: <GuidedTourIntroBannerDark />,
    modalVariant: ModalVariant.medium,
  },
});

export default getGuidedTour();
