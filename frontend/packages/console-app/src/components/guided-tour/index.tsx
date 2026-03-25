import type { FC } from 'react';
import { Content, ContentVariants, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { TourDataType } from '@console/app/src/components/tour';
import AdminGuidedTourBanner from '../tour/AdminGuidedTourBanner';
import AdminGuidedTourBannerDark from '../tour/AdminGuidedTourBannerDark';
import { finishTourText, helpTourText, userPreferencesTourText } from './GuidedTourText';

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

const IntroductionText: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Content component={ContentVariants.p}>
        {t(
          'console-app~Introducing a fresh modern look to the console! With this update, we made changes to the user interface to enhance usability and streamline your workflow. This includes improved navigation and visual refinement to help manage your applications and infrastructure more easily.',
        )}
      </Content>
      <Content component={ContentVariants.h6}>
        {t('console-app~What do you want to do next?')}
      </Content>
    </>
  );
};

export const getGuidedTour = (): TourDataType => ({
  intro: {
    // t('console-app~Welcome to the new OpenShift experience!')
    heading: '%console-app~Welcome to the new OpenShift experience!%',
    content: <IntroductionText />,
    introBannerLight: <AdminGuidedTourBanner />,
    introBannerDark: <AdminGuidedTourBannerDark />,
    modalVariant: ModalVariant.large,
  },
  steps: [
    {
      placement: 'right',
      // t('console-app~Home')
      heading: '%console-app~Home%',
      // t('console-app~Here is where you can view all of your OpenShift environments, including your projects and inventory. You can also access APIs and software catalogs.')
      content:
        '%console-app~Here is where you can view all of your OpenShift environments, including your projects and inventory. You can also access APIs and software catalogs.%',
      selector: getSelector('tour-home-nav'),
    },
    {
      placement: 'right',
      // t('console-app~Software Catalog')
      heading: '%console-app~Software Catalog%',
      // t('console-app~Add shared applications, services, event sources, or source-to-image builders to your project. Cluster administrators can customize the content made available in the catalog.')
      content:
        '%console-app~Add shared applications, services, event sources, or source-to-image builders to your project. Cluster administrators can customize the content made available in the catalog.%',
      selector: getSelector('tour-software-catalog-nav'),
      expandableSelector: getSelector('tour-ecosystem-nav'),
    },
    {
      placement: 'bottom',
      // t('console-app~Quick create')
      heading: '%console-app~Quick create%',
      // t('console-app~Create resources in just a few steps via Git, YAML,  or container images.')
      content:
        '%console-app~Create resources in just a few steps via Git, YAML,  or container images.%',
      selector: getSelector('tour-quick-create-button'),
    },
    {
      placement: 'bottom',
      // t('console-app~Help')
      heading: '%console-app~Help%',
      content: helpTourText,
      selector: getSelector('tour-help-button'),
    },
    {
      placement: 'bottom',
      // t('console-app~User Preferences')
      heading: '%console-app~User Preferences%',
      content: userPreferencesTourText,
      selector: getSelector('tour-user-button'),
    },
  ],
  end: {
    // t('console-app~You’re ready to go!')
    heading: '%console-app~You’re ready to go!%',
    content: finishTourText,
    introBannerLight: <AdminGuidedTourBanner />,
    introBannerDark: <AdminGuidedTourBannerDark />,
    modalVariant: ModalVariant.medium,
  },
});

export default getGuidedTour();
