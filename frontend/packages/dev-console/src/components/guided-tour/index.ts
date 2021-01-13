import { TourDataType } from '@console/app/src/components/tour';
import i18n from '@console/internal/i18n';
import {
  perspectiveSwitcherTourText,
  searchTourText,
  finishTourText,
  devPerspectiveTourText,
} from './GuidedTourText';

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

export const getGuidedTour = (): TourDataType => ({
  intro: {
    heading: i18n.t('devconsole~Welcome to the Developer Perspective!'),
    content: devPerspectiveTourText,
  },
  steps: [
    {
      placement: 'right',
      heading: i18n.t('devconsole~Perspective Switcher'),
      content: perspectiveSwitcherTourText,
      selector: getSelector('tour-perspective-dropdown'),
    },
    {
      placement: 'right',
      heading: i18n.t('devconsole~Monitoring'),
      content: i18n.t(
        'devconsole~Monitor application metrics, create custom metrics queries and view and silence alerts in your project.',
      ),
      selector: getSelector('tour-monitoring-nav'),
    },
    {
      placement: 'right',
      heading: i18n.t('devconsole~Search'),
      content: searchTourText,
      selector: getSelector('tour-search-nav'),
    },
    {
      flags: ['DEVWORKSPACE'],
      placement: 'bottom',
      heading: i18n.t('devconsole~Web Terminal'),
      content: i18n.t(
        'devconsole~Use command line tools directly from the Console. CLIs are pre-installed and fully authenticated when you need them.',
      ),
      selector: getSelector('tour-cloud-shell-button'),
    },
    {
      placement: 'bottom',
      heading: i18n.t('devconsole~Help'),
      content: i18n.t(
        'devconsole~Restart this tour or access our new quick starts where you can learn more about creating or deploying an application using OpenShift Developer Console.',
      ),
      selector: getSelector('tour-help-button'),
    },
  ],
  end: {
    heading: i18n.t('devconsole~You’re ready to go!'),
    content: finishTourText,
  },
});
