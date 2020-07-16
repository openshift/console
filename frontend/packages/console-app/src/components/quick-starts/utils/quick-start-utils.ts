import { mockQuickStarts, mockStatus, mockPrerequisiteStatus } from './quick-start-mocks';
import { QuickStartCatalogItem, QuickStartItem } from './quick-start-typings';

const getQuickStarts = (): QuickStartItem[] => {
  return mockQuickStarts;
};

export const getQuickStartsWithStatus = (): QuickStartCatalogItem[] => {
  const items = getQuickStarts();
  return items.map((item) => {
    return {
      ...item,
      ...mockStatus[item.name],
      unmetPrerequisite: mockPrerequisiteStatus[item.name],
    };
  });
};

export const getQuickStart = (quickStartID: string): QuickStartItem => {
  return mockQuickStarts.find((qs) => qs.id === quickStartID);
};
