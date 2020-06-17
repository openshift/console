import { mockGuidedTours, mockStatus } from './guided-tour-mocks';
import { TourStatus, GuidedTourItem } from './guided-tour-typings';

type GuidedTourCatalogItem = GuidedTourItem & TourStatus;
const getGuidedTours = (): GuidedTourItem[] => {
  return mockGuidedTours;
};

export const getGuidedToursWithStatus = (): GuidedTourCatalogItem[] => {
  const items = getGuidedTours();
  return items.map((item) => {
    return { ...item, ...mockStatus[item.name] };
  });
};
