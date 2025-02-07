import { TourDataType } from '@console/app/src/components/tour';
import { finishTourText } from '@console/dev-console/src/components/guided-tour/GuidedTourText';

const getSelector = (id: string): string => `[data-tour-id="${id}"]`;

export const getGuidedTour = (): TourDataType => ({
  intro: {
    // t('console-app~Welcome to the Developer Perspective!')
    heading: '%console-app~Welcome to the Unified Perspective%',
    content:
      'Get started with a tour of some of the key areas in Openshift 4.19 unified perspective that can help you complete workflows and be more productive. Three-martini lunch cross functional temas enable out of the box brainstroming.',
  },
  steps: [
    {
      placement: 'right',
      // t('console-app~Software Catalog')
      heading: '%console-app~Software Catalog%',
      // t('console-app~Add shared applications, services, event sources, or source-to-image builders to your Project from the software catalog. Cluster administrators can customize the content made available in the catalog.')
      content:
        '%console-app~Add shared applications, services, event sources, or source-to-image builders to your Project from the software catalog. Cluster administrators can customize the content made available in the catalog.%',
      selector: getSelector('tour-software-catalog-nav'),
      expandableSelector: getSelector('tour-home-nav'),
    },
    {
      placement: 'right',
      // t('console-app~Helm')
      heading: '%console-app~Helm%',
      // t('console-app~Browse for charts that help manage complex installations and upgrades. Cluster administrators can customize the content made available in the catalog.')
      content:
        '%console-app~Browse for charts that help manage complex installations and upgrades. Cluster administrators can customize the content made available in the catalog.%',
      selector: getSelector('tour-admin-helm-nav'),
    },
    {
      placement: 'right',
      // t('console-app~Topology')
      heading: '%console-app~Topology%',
      // t('console-app~Topology view provides a visual representation of all the applications within a project, their build status, and the components and services associated with them.')
      content:
        '%console-app~Topology view provides a visual representation of all the applications within a project, their build status, and the components and services associated with them.%',
      selector: getSelector('tour-admin-topology-nav'),
      expandableSelector: getSelector('tour-workloads-nav'),
    },
  ],
  end: {
    // t('console-app~You’re ready to go!')
    heading: '%console-app~You’re ready to go!%',
    content: finishTourText,
  },
});
