import { CatalogItem } from '@console/plugin-sdk';

export const keywordCompare = (filterString: string, item: CatalogItem) => {
  if (!filterString) {
    return true;
  }
  if (!item) {
    return false;
  }

  return (
    item.name.toLowerCase().includes(filterString) ||
    (item.description && item.description.toLowerCase().includes(filterString)) ||
    (item.tags && item.tags.includes(filterString))
  );
};
