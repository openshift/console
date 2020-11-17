import { normalizeIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { CatalogItem } from '@console/plugin-sdk';
import * as catalogImg from '@console/internal/imgs/logos/catalog-icon.svg';

export const NoGrouping = 'none';

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

export const getIconProps = (item: CatalogItem) => {
  const { icon } = item;
  if (icon.url) {
    return { iconImg: icon.url, iconClass: null };
  }
  if (icon.class) {
    return { iconImg: null, iconClass: normalizeIconClass(icon.class) };
  }
  return { iconImg: catalogImg, iconClass: null };
};
