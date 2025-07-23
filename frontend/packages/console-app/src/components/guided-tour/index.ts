import { TourDataType } from '@console/app/src/components/tour';
import { finishTourText, helpTourText, userPreferencesTourText } from './GuidedTourText';

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

export const getGuidedTour = (): TourDataType => ({
  intro: {
    // t('console-app~Welcome to the new OpenShift experience!')
    heading: '%console-app~Welcome to the new OpenShift experience!%',
    // t('console-app~Our new update with OpenShift 4.19 gives a more modern look to help enhance your experience and streamline your workflow, such as improved navigation and infrastructure. Want us to show you around?')
    content:
      '%console-app~Our new update with OpenShift 4.19 gives a more modern look to help enhance your experience and streamline your workflow, such as improved navigation and infrastructure. Want us to show you around?%',
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
  },
});
