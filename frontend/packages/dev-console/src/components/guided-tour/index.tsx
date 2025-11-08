import { ReactNode } from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  finishTourText,
  helpTourText,
  userPreferencesTourText,
} from '@console/app/src/components/guided-tour/GuidedTourText';
import { TourDataType } from '@console/app/src/components/tour';
import GuidedTourIntroBanner from './GuidedTourIntroBanner';
import GuidedTourIntroBannerDark from './GuidedTourIntroBannerDark';
import {
  perspectiveSwitcherTourText,
  searchTourText,
  devPerspectiveTourText,
  webTerminalGuidedTourText,
} from './GuidedTourText';

/** Generate a react node for translation strings */
const t = (string: string): ReactNode => {
  const TranslatedString = () => {
    const { t: tFunction } = useTranslation();
    return <>{tFunction(string)}</>;
  };
  return <TranslatedString />;
};

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

export const getGuidedTour = (): TourDataType => ({
  intro: {
    heading: t('devconsole~Welcome to the Developer Perspective!'),
    content: devPerspectiveTourText,
    introBannerLight: <GuidedTourIntroBanner />,
    introBannerDark: <GuidedTourIntroBannerDark />,
    modalVariant: ModalVariant.medium,
  },
  steps: [
    {
      placement: 'right',
      heading: t('devconsole~Perspective Switcher'),
      content: perspectiveSwitcherTourText,
      selector: getSelector('tour-perspective-dropdown'),
    },
    {
      placement: 'right',
      heading: t('devconsole~Observe'),
      content: t(
        'devconsole~Monitor application metrics, create custom metrics queries and view and silence alerts in your project.',
      ),
      selector: getSelector('tour-software-catalog-nav'),
    },
    {
      placement: 'right',
      heading: t('devconsole~Search'),
      content: searchTourText,
      selector: getSelector('tour-search-nav'),
    },
    {
      flags: ['DEVWORKSPACE'],
      placement: 'bottom',
      heading: t('devconsole~Web Terminal'),
      content: webTerminalGuidedTourText,
      selector: getSelector('tour-cloud-shell-button'),
    },
    {
      placement: 'bottom',
      heading: t('devconsole~Help'),
      content: helpTourText,
      selector: getSelector('tour-help-button'),
    },
    {
      placement: 'bottom',
      heading: t('devconsole~User Preferences'),
      content: userPreferencesTourText,
      selector: getSelector('tour-user-button'),
    },
  ],
  end: {
    heading: t('devconsole~You’re ready to go!'),
    content: finishTourText,
    introBannerLight: <GuidedTourIntroBanner />,
    introBannerDark: <GuidedTourIntroBannerDark />,
    modalVariant: ModalVariant.medium,
  },
});

export default getGuidedTour();
