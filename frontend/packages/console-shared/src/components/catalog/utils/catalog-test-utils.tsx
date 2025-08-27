import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import {
  calculateCatalogItemRelevanceScore,
  getRedHatPriority,
  keywordCompare,
  REDHAT_PRIORITY,
} from './catalog-utils';

/**
 * Enhanced search function that preserves computed scores for testing and debugging.
 *
 * @param items - The catalog items to search
 * @param searchTerm - The search term to filter by
 * @returns Object containing filtered items and a map of pre-computed scores
 */
export const searchWithPreservedScores = (
  items: CatalogItem[],
  searchTerm: string,
): {
  filteredItems: CatalogItem[];
  scoresMap: Map<string, { relevanceScore: number; redHatPriority: number }>;
} => {
  if (!searchTerm) {
    // No search term - just calculate Red Hat priorities for sorting
    const scoresMap = new Map<string, { relevanceScore: number; redHatPriority: number }>();

    items.forEach((item) => {
      scoresMap.set(item.uid, {
        relevanceScore: 0, // No relevance score for non-search
        redHatPriority: getRedHatPriority(item),
      });
    });

    const filteredItems = keywordCompare(searchTerm, items);
    return { filteredItems, scoresMap };
  }

  // With search term - capture scores before they get stripped
  const itemsWithScores = items.map((item) => ({
    ...item,
    relevanceScore: calculateCatalogItemRelevanceScore(searchTerm, item),
    redHatPriority: getRedHatPriority(item),
  }));

  // Create scores map from computed values
  const scoresMap = new Map<string, { relevanceScore: number; redHatPriority: number }>();
  itemsWithScores.forEach((item) => {
    scoresMap.set(item.uid, {
      relevanceScore: item.relevanceScore,
      redHatPriority: item.redHatPriority,
    });
  });

  // Use the regular keywordCompare which will strip scores but apply filtering/sorting
  const filteredItems = keywordCompare(searchTerm, items);

  return { filteredItems, scoresMap };
};

/**
 * Displays a console.table with catalog search results and relevance scoring
 */
export const displayCatalogResultsTable = (
  items: CatalogItem[],
  searchTerm: string,
  filterDescription: string,
  preComputedScores?: Map<string, { relevanceScore: number; redHatPriority: number }>,
): void => {
  if (items.length === 0) {
    return;
  }

  const tableData = items.map((item) => {
    // Use pre-computed scores if available, otherwise calculate (fallback for compatibility)
    let relevanceScore: number | string;
    let redHatPriority: number;

    if (preComputedScores && preComputedScores.has(item.uid)) {
      const scores = preComputedScores.get(item.uid);
      if (scores) {
        relevanceScore = searchTerm ? scores.relevanceScore : 'N/A (No search)';
        redHatPriority = scores.redHatPriority;
      } else {
        // Fallback if scores is unexpectedly undefined
        relevanceScore = searchTerm
          ? calculateCatalogItemRelevanceScore(searchTerm, item)
          : 'N/A (No search)';
        redHatPriority = getRedHatPriority(item);
      }
    } else {
      // Fallback: Check if scores are still attached to items or recalculate
      relevanceScore = searchTerm
        ? (item as any).relevanceScore ?? calculateCatalogItemRelevanceScore(searchTerm, item)
        : 'N/A (No search)';
      redHatPriority = (item as any).redHatPriority ?? getRedHatPriority(item);
    }

    // Format Red Hat priority display
    const isRedHatProvider =
      redHatPriority === REDHAT_PRIORITY.EXACT_MATCH
        ? `Exact Match (${REDHAT_PRIORITY.EXACT_MATCH})`
        : redHatPriority === REDHAT_PRIORITY.CONTAINS_REDHAT
        ? `Contains Red Hat (${REDHAT_PRIORITY.CONTAINS_REDHAT})`
        : `Non-Red Hat (${REDHAT_PRIORITY.NON_REDHAT})`;

    return {
      Title: item.name || 'N/A',
      'Search Relevance Score': relevanceScore,
      'Is Red Hat Provider (Priority)': isRedHatProvider,
      Provider: item.attributes?.provider || item.provider || 'N/A',
      Type: item.type || 'N/A',
    };
  });

  // eslint-disable-next-line no-console
  console.log(`\n🎯 CATALOG Results: ${filterDescription} (${items.length} matches)`);
  // eslint-disable-next-line no-console
  console.table(tableData);
};

/**
 * Builds a filter description string from active filters
 */
export const buildFilterDescription = (
  searchTerm: string,
  activeCategoryId: string,
  activeFilters: any,
): string => {
  const activeFilterDescriptions = [];

  if (searchTerm) {
    activeFilterDescriptions.push(`Search: "${searchTerm}"`);
  }

  if (activeCategoryId !== 'all') {
    activeFilterDescriptions.push(`Category: ${activeCategoryId}`);
  }

  Object.entries(activeFilters).forEach(([filterType, filterGroup]) => {
    const activeFilterValues = Object.entries(filterGroup as any)
      .filter(([, filter]: [string, any]) => filter.active)
      .map(([, filter]: [string, any]) => filter.label || filter.value);
    if (activeFilterValues.length > 0) {
      activeFilterDescriptions.push(`${filterType}: [${activeFilterValues.join(', ')}]`);
    }
  });

  return activeFilterDescriptions.length > 0 ? activeFilterDescriptions.join(' + ') : 'No filters';
};
