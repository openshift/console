import { history } from '@console/internal/components/utils';
import { normalizeIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { CatalogItem } from '@console/plugin-sdk';
import * as catalogImg from '@console/internal/imgs/logos/catalog-icon.svg';
import { CatalogType, CatalogTypeCounts } from './types';

export const NO_GROUPING = 'none';

export const DEFAULT_CATEGORY = 'all';

export const OTHER_CATEGORY = 'other';

export const keywordCompare = (filterString: string, item: CatalogItem): boolean => {
  if (!filterString) {
    return true;
  }
  if (!item) {
    return false;
  }

  const filterStringLowerCase = filterString.toLowerCase();
  return (
    item.name.toLowerCase().includes(filterStringLowerCase) ||
    (typeof item.description === 'string' &&
      item.description.toLowerCase().includes(filterStringLowerCase)) ||
    (item.tags && item.tags.some((tag) => tag.includes(filterStringLowerCase)))
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

export const setURLParams = (params: URLSearchParams) => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export const updateURLParams = (paramName: string, value: string | string[]) => {
  const params = new URLSearchParams(window.location.search);

  if (value) {
    params.set(paramName, Array.isArray(value) ? JSON.stringify(value) : value);
  } else {
    params.delete(paramName);
  }
  setURLParams(params);
};

export const getCatalogTypeCounts = (
  items: CatalogItem[],
  catalogTypes: CatalogType[],
): CatalogTypeCounts => {
  const catalogTypeCounts = {};

  catalogTypes.forEach((catalogType) => {
    const matchedItems = items.filter((item) => item.type === catalogType.value);
    catalogTypeCounts[catalogType.value] = matchedItems.length;
  });

  return catalogTypeCounts;
};
