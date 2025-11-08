import type { ReactNode } from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TourDataType } from '@console/app/src/components/tour';
import AdminGuidedTourBanner from '../tour/AdminGuidedTourBanner';
import AdminGuidedTourBannerDark from '../tour/AdminGuidedTourBannerDark';
import {
  finishTourText,
  helpTourText,
  introductionText,
  userPreferencesTourText,
} from './GuidedTourText';

/** Generate a react node for translation strings */
const t = (i18nKey: string): ReactNode => {
  const TranslatedString = () => {
    const { t: tFunction } = useTranslation();
    return <>{tFunction(i18nKey)}</>;
  };
  return <TranslatedString />;
};

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

export const getGuidedTour = (): TourDataType => ({
  intro: {
    heading: t('console-app~Welcome to the new OpenShift experience!'),
    content: introductionText,
    introBannerLight: <AdminGuidedTourBanner />,
    introBannerDark: <AdminGuidedTourBannerDark />,
    modalVariant: ModalVariant.large,
  },
  steps: [
    {
      placement: 'right',
      heading: t('console-app~Home'),
      content: t(
        'console-app~Here is where you can view all of your OpenShift environments, including your projects and inventory. You can also access APIs and software catalogs.',
      ),
      selector: getSelector('tour-home-nav'),
    },
    {
      placement: 'right',
      heading: t('console-app~Software Catalog'),
      content: t(
        'console-app~Add shared applications, services, event sources, or source-to-image builders to your project. Cluster administrators can customize the content made available in the catalog.',
      ),
      selector: getSelector('tour-software-catalog-nav'),
      expandableSelector: getSelector('tour-ecosystem-nav'),
    },
    {
      placement: 'bottom',
      heading: t('console-app~Quick create'),
      content: t(
        'console-app~Create resources in just a few steps via Git, YAML,  or container images.',
      ),
      selector: getSelector('tour-quick-create-button'),
    },
    {
      placement: 'bottom',
      heading: t('console-app~Help'),
      content: helpTourText,
      selector: getSelector('tour-help-button'),
    },
    {
      placement: 'bottom',
      heading: t('console-app~User Preferences'),
      content: userPreferencesTourText,
      selector: getSelector('tour-user-button'),
    },
  ],
  end: {
    heading: t('console-app~You’re ready to go!'),
    content: finishTourText,
    introBannerLight: <AdminGuidedTourBanner />,
    introBannerDark: <AdminGuidedTourBannerDark />,
    modalVariant: ModalVariant.medium,
  },
});

export default getGuidedTour();
