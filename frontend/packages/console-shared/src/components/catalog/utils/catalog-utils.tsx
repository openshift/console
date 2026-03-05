import { useMemo } from 'react';
import * as _ from 'lodash';
import type { NavigateFunction } from 'react-router-dom-v5-compat';
import type { CatalogItemType } from '@console/dynamic-plugin-sdk';
import { isCatalogItemType } from '@console/dynamic-plugin-sdk';
import type {
  CatalogItem,
  CatalogItemDetails,
  CatalogItemMetadataProviderFunction,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { normalizeIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import catalogImg from '@console/internal/imgs/logos/catalog-icon.svg';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import type { CatalogType, CatalogTypeCounts } from './types';
import { CatalogSortOrder } from './types';

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

// Enhanced scoring constants for operator relevance calculation
const SCORE = {
  // Title/Name matches (highest priority)
  TITLE_CONTAINS: 100,
  TITLE_EXACT_BONUS: 50,
  TITLE_STARTS_BONUS: 25,

  // Keywords/tags matches (medium priority)
  KEYWORD_MATCH: 60,

  // Description matches (low priority)
  DESCRIPTION_CONTAINS: 20,
  DESCRIPTION_STARTS_BONUS: 5,
} as const;

// Red Hat priority constants
const REDHAT_PRIORITY = {
  EXACT_MATCH: 2,
  CONTAINS_REDHAT: 1,
  NON_REDHAT: 0,
} as const;

// Sorting thresholds
const SORTING_THRESHOLDS = {
  REDHAT_PRIORITY_DELTA: 100, // Score difference threshold for Red Hat prioritization
} as const;

// Enhanced relevance scoring for catalog items (especially operators)
export const calculateCatalogItemRelevanceScore = (
  filterString: string,
  item: CatalogItem,
): number => {
  if (!filterString || !item) {
    return 0;
  }

  const searchTerm = filterString.toLowerCase();
  let score = 0;

  // Title/Name matches get highest weight
  if (item.name && typeof item.name === 'string') {
    const itemName = item.name.toLowerCase();
    if (itemName.includes(searchTerm)) {
      score += SCORE.TITLE_CONTAINS;
      // Exact title match gets bonus points
      if (itemName === searchTerm) {
        score += SCORE.TITLE_EXACT_BONUS;
      }
      // Title starts with search term gets bonus points
      if (itemName.startsWith(searchTerm)) {
        score += SCORE.TITLE_STARTS_BONUS;
      }
    }
  }

  // Keywords/tags matches get medium weight
  // Check tags array (for software types other than operators)
  if (item.tags && Array.isArray(item.tags)) {
    const keywords = item.tags.map((k) => k.toLowerCase());
    if (keywords.includes(searchTerm)) {
      score += SCORE.KEYWORD_MATCH;
    }
  }

  // Check keywords array (for operators)
  if (item.attributes?.keywords && Array.isArray(item.attributes.keywords)) {
    const attributeKeywords = item.attributes.keywords.map((k) => k.toLowerCase());
    if (attributeKeywords.includes(searchTerm)) {
      score += SCORE.KEYWORD_MATCH;
    }
  }

  // Description matches get lowest weight
  if (item.description && typeof item.description === 'string') {
    const descriptionLower = item.description.toLowerCase();
    if (descriptionLower.includes(searchTerm)) {
      score += SCORE.DESCRIPTION_CONTAINS;
      // Description starts with search term gets small bonus
      if (descriptionLower.startsWith(searchTerm)) {
        score += SCORE.DESCRIPTION_STARTS_BONUS;
      }
    }
  }

  return score;
};

// Determine Red Hat priority for catalog items
export const getRedHatPriority = (item: CatalogItem): number => {
  // Check provider attribute for operators
  const provider = item.attributes?.provider || item.provider;
  if (provider) {
    const providerLower = provider.toLowerCase();
    if (/^red hat(,?\s?inc\.?)?$/.test(providerLower)) {
      return REDHAT_PRIORITY.EXACT_MATCH; // Highest priority for exact matches
    }
    if (providerLower.includes('red hat')) {
      return REDHAT_PRIORITY.CONTAINS_REDHAT; // Medium priority for contains 'red hat'
    }
  }

  return REDHAT_PRIORITY.NON_REDHAT; // Not Red Hat
};

// Removed catalogItemCompare - using enhanced scoring instead

// Enhanced keyword comparison with relevance scoring and Red Hat prioritization
export const keywordCompare = (filterString: string, items: CatalogItem[]): CatalogItem[] => {
  // eslint-disable-next-line no-console
  console.log('🔍 Enhanced keywordCompare called:', {
    filterString,
    itemCount: items.length,
    catalogType: items[0]?.type || 'unknown',
  });

  if (!filterString) {
    // No search term - sort by Red Hat priority and then alphabetically
    const sortedItems = [...items].sort((a, b) => {
      const aPriority = getRedHatPriority(a);
      const bPriority = getRedHatPriority(b);

      // Primary sort by Red Hat priority
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Secondary sort by name (alphabetical)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    // Reduced logging - detailed logging now happens in CatalogView after all filtering
    if (sortedItems.length > 0 && sortedItems[0]?.type === 'operator') {
      // eslint-disable-next-line no-console
      console.log(
        `📂 keywordCompare (No Search) - Red Hat Priority Sorting (${sortedItems.length} items)`,
      );
    }

    return sortedItems;
  }

  // With search term - use relevance scoring
  const itemsWithScores = items.map((item) => ({
    ...item,
    relevanceScore: calculateCatalogItemRelevanceScore(filterString, item),
    redHatPriority: getRedHatPriority(item),
  }));

  // Filter items that have relevance score > 0
  const matchingItems = itemsWithScores.filter((item) => item.relevanceScore > 0);

  // Sort by relevance score and Red Hat priority
  const sortedItems = matchingItems.sort((a, b) => {
    const scoreDiff = Math.abs(b.relevanceScore - a.relevanceScore);

    // For items with similar relevance scores (within threshold),
    // prioritize Red Hat first to ensure consistent ordering
    if (scoreDiff <= SORTING_THRESHOLDS.REDHAT_PRIORITY_DELTA) {
      if (a.redHatPriority !== b.redHatPriority) {
        return b.redHatPriority - a.redHatPriority;
      }
    }

    // Primary sort by relevance score (descending)
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }

    // Secondary sort by Red Hat priority when scores are exactly equal
    if (a.redHatPriority !== b.redHatPriority) {
      return b.redHatPriority - a.redHatPriority;
    }

    // Tertiary sort by name (alphabetical)
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  // Reduced logging - detailed logging now happens in CatalogView after all filtering
  if (sortedItems.length > 0 && sortedItems[0]?.type === 'operator') {
    // eslint-disable-next-line no-console
    console.log(
      `🔍 keywordCompare (Search: "${filterString}") - Relevance Scoring (${sortedItems.length} matches)`,
    );
  }

  // Remove the added properties before returning
  return sortedItems.map(({ relevanceScore, redHatPriority, ...item }) => item);
};

/**
 * Sort catalog items based on the selected sort order.
 * @param items - Array of catalog items to sort
 * @param sortOrder - Sort order: RELEVANCE (default), ASC (A-Z), or DESC (Z-A)
 * @param searchKeyword - Optional search keyword for filtering and relevance scoring
 * @returns Sorted and filtered array of catalog items
 */
export const sortCatalogItems = (
  items: CatalogItem[],
  sortOrder: CatalogSortOrder = CatalogSortOrder.RELEVANCE,
  searchKeyword = '',
): CatalogItem[] => {
  if (!items || items.length === 0) {
    return items;
  }

  // First, filter items by search keyword if provided
  let filteredItems = items;
  if (searchKeyword) {
    const searchTerm = searchKeyword.toLowerCase();
    filteredItems = items.filter((item) => {
      const relevanceScore = calculateCatalogItemRelevanceScore(searchTerm, item);
      return relevanceScore > 0;
    });
  }

  // Then, sort the filtered items based on the selected sort order
  switch (sortOrder) {
    case CatalogSortOrder.RELEVANCE:
      // Use the existing keywordCompare function for relevance-based sorting
      // Note: keywordCompare handles its own filtering, so we pass the original items
      return keywordCompare(searchKeyword, items);

    case CatalogSortOrder.ASC:
      // Sort alphabetically A-Z (pure alphabetical, no Red Hat prioritization)
      return [...filteredItems].sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

    case CatalogSortOrder.DESC:
      // Sort alphabetically Z-A (pure alphabetical, no Red Hat prioritization)
      return [...filteredItems].sort((a, b) => {
        return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
      });

    default:
      // Fallback to relevance sorting
      return keywordCompare(searchKeyword, items);
  }
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

export const setURLParams = (params: URLSearchParams, navigate: NavigateFunction) => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  navigate(`${url.pathname}${searchParams}`, { replace: true });
};

export const updateURLParams = (
  paramName: string,
  value: string | string[],
  navigate: NavigateFunction,
) => {
  const params = new URLSearchParams(window.location.search);

  if (value) {
    params.set(paramName, Array.isArray(value) ? JSON.stringify(value) : value);
  } else {
    params.delete(paramName);
  }
  setURLParams(params, navigate);
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
