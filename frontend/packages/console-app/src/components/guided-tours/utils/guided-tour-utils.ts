import { mockGuidedTours, mockStatus, mockPrerequisiteStatus } from './guided-tour-mocks';
import { GuidedTourCatalogItem, GuidedTourItem } from './guided-tour-typings';

const getGuidedTours = (): GuidedTourItem[] => {
  return mockGuidedTours;
};

export const getGuidedToursWithStatus = (): GuidedTourCatalogItem[] => {
  const items = getGuidedTours();
  return items.map((item) => {
    return {
      ...item,
      ...mockStatus[item.name],
      unmetPrerequisite: mockPrerequisiteStatus[item.name],
    };
  });
};

export const getGuidedTour = (tourID: string): GuidedTourItem => {
  return mockGuidedTours.find((tour) => tour.id === tourID);
};
