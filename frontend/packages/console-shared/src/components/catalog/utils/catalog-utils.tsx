import { useMemo } from 'react';
import * as _ from 'lodash';
import { CatalogItemType, isCatalogItemType } from '@console/dynamic-plugin-sdk';
import {
  CatalogItem,
  CatalogItemDetails,
  CatalogItemMetadataProviderFunction,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { normalizeIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { history } from '@console/internal/components/utils';
import catalogImg from '@console/internal/imgs/logos/catalog-icon.svg';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { keywordFilter } from '../../../utils/keyword-filter';
import { CatalogType, CatalogTypeCounts } from './types';

enum CatalogVisibilityState {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

type SoftwareCatalogTypesConfig = {
  state: CatalogVisibilityState;
  enabled?: string[];
  disabled?: string[];
};

/**
 * Reads and parses the developerCatalogTypes config from SERVER_FLAGS.
 * Has to be dynamic for unit tests to run
 */
const getSoftwareCatalogTypes = (): SoftwareCatalogTypesConfig | undefined => {
  if (!window.SERVER_FLAGS.developerCatalogTypes) {
    return undefined;
  }
  try {
    return JSON.parse(window.SERVER_FLAGS.developerCatalogTypes) as SoftwareCatalogTypesConfig;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse developerCatalogTypes:', e);
    return undefined;
  }
};

const catalogItemCompare = (keyword: string, item: CatalogItem): boolean => {
  if (!item) {
    return false;
  }
  return (
    item.name.toLowerCase().includes(keyword) ||
    (typeof item.description === 'string' && item.description.toLowerCase().includes(keyword)) ||
    item.type.toLowerCase().includes(keyword) ||
    item.tags?.some((tag) => tag.includes(keyword)) ||
    item.cta?.label.toLowerCase().includes(keyword)
  );
};

export const keywordCompare = (filterString: string, items: CatalogItem[]): CatalogItem[] => {
  return keywordFilter(filterString, items, catalogItemCompare);
};

export const getIconProps = (item: CatalogItem) => {
  const { icon } = item;
  if (!icon) {
    return {};
  }
  if (icon.url) {
    return { iconImg: icon.url, iconClass: null };
  }
  if (icon.class) {
    return { iconImg: null, iconClass: normalizeIconClass(icon.class) };
  }
  if (icon.node) {
    return { iconImg: null, iconClass: null, icon: icon.node };
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

export const getURLWithParams = (paramName: string, value: string | string[]): string => {
  const params = new URLSearchParams(window.location.search);
  const url = new URL(window.location.href);

  if (value) {
    params.set(paramName, Array.isArray(value) ? JSON.stringify(value) : value);
  } else {
    params.delete(paramName);
  }

  const searchParams = `?${params.toString()}${url.hash}`;
  return `${url.pathname}${searchParams}`;
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

export const customPropertyPresent = (
  catalogItemDetails: CatalogItemDetails,
  proppertyName: string,
): boolean => {
  return catalogItemDetails?.properties?.some((property) => property.label === proppertyName);
};

export const applyCatalogItemMetadata = (
  catalogItems: CatalogItem[],
  metadataProviderMap: {
    [type: string]: { [id: string]: CatalogItemMetadataProviderFunction };
  },
) =>
  catalogItems.map((item) => {
    const metadataProviders = Object.values(metadataProviderMap[item.type] ?? {});
    if (metadataProviders?.length) {
      const metadata = metadataProviders
        .map((metadataProvider) => metadataProvider(item))
        .filter((x) => x);

      const tags = _.flatten(metadata.map((m) => m.tags).filter((x) => x));
      const badges = _.flatten(metadata.map((m) => m.badges).filter((x) => x));
      const attributes = metadata.reduce(
        (acc, m) => Object.assign(acc, m.attributes),
        {} as CatalogItem['attributes'],
      );
      const attributeCount = Object.keys(attributes).length;
      if (tags.length > 0 || badges.length > 0 || attributeCount > 0) {
        return {
          ...item,
          tags: tags.length > 0 ? [...(item.tags ?? []), ...tags] : item.tags,
          badges: badges.length > 0 ? [...(item.badges ?? []), ...badges] : item.badges,
          attributes: attributeCount ? { ...item.attributes, ...attributes } : item.attributes,
        };
      }
    }
    return item;
  });

export const isCatalogTypeEnabled = (catalogType: string): boolean => {
  const softwareCatalogTypes = getSoftwareCatalogTypes();
  if (softwareCatalogTypes) {
    if (
      softwareCatalogTypes?.state === CatalogVisibilityState.Enabled &&
      softwareCatalogTypes?.enabled?.length > 0
    ) {
      return softwareCatalogTypes?.enabled.includes(catalogType);
    }
    if (softwareCatalogTypes?.state === CatalogVisibilityState.Disabled) {
      if (softwareCatalogTypes?.disabled?.length > 0) {
        return !softwareCatalogTypes?.disabled.includes(catalogType);
      }
      return false;
    }
  }
  return true;
};

export const useGetAllDisabledSubCatalogs = () => {
  const catalogExtensionsArray = useExtensions<CatalogItemType>(isCatalogItemType);
  const softwareCatalogTypes = useMemo(() => getSoftwareCatalogTypes(), []);

  return useMemo(() => {
    const catalogTypeExtensions = catalogExtensionsArray.map((type) => type.properties.type);

    if (softwareCatalogTypes) {
      if (
        softwareCatalogTypes?.state === CatalogVisibilityState.Enabled &&
        softwareCatalogTypes?.enabled?.length > 0
      ) {
        const disabledSubCatalogs = catalogTypeExtensions.filter(
          (val) => !softwareCatalogTypes?.enabled.includes(val),
        );
        return [disabledSubCatalogs];
      }
      if (softwareCatalogTypes?.state === CatalogVisibilityState.Disabled) {
        if (softwareCatalogTypes?.disabled?.length > 0) {
          return [softwareCatalogTypes?.disabled];
        }
        return [catalogTypeExtensions];
      }
    }
    return [[]];
  }, [catalogExtensionsArray, softwareCatalogTypes]);
};

export const useIsSoftwareCatalogEnabled = (): boolean => {
  const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
  const catalogExtensionsArray = useExtensions<CatalogItemType>(isCatalogItemType);
  const catalogTypeExtensions = catalogExtensionsArray.map((type) => {
    return type.properties.type;
  });
  if (disabledSubCatalogs?.length === catalogTypeExtensions?.length) {
    return (
      JSON.stringify(disabledSubCatalogs.sort()) !== JSON.stringify(catalogTypeExtensions.sort())
    );
  }
  return true;
};
