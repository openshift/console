import type { ReactNode, FC } from 'react';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { isModalOpen } from '@console/internal/components/modals';
import { useQueryParams } from '../../../hooks/useQueryParams';
import PaneBody from '../../layout/PaneBody';
import {
  setURLParams,
  updateURLParams,
  getCatalogTypeCounts,
  calculateCatalogItemRelevanceScore,
  getRedHatPriority,
} from '../utils/catalog-utils';
import {
  categorize,
  findActiveCategory,
  ALL_CATEGORY,
  OTHER_CATEGORY,
  NO_GROUPING,
} from '../utils/category-utils';
import {
  filterByAttributes,
  filterByCategory,
  filterBySearchKeyword,
  getActiveFilters,
  getFilterGroupCounts,
  getFilterSearchParam,
} from '../utils/filter-utils';
import type {
  CatalogFilterCounts,
  CatalogFilterGroupMap,
  CatalogFilters as FiltersType,
  CatalogStringMap,
  CatalogType,
  CatalogTypeCounts,
} from '../utils/types';
import { CatalogQueryParams, CatalogSortOrder } from '../utils/types';
import CatalogCategories from './CatalogCategories';
import CatalogEmptyState from './CatalogEmptyState';
import CatalogFilters from './CatalogFilters';
import CatalogGrid from './CatalogGrid';
import CatalogPage from './CatalogPage';
import CatalogPageContent from './CatalogPageContent';
import CatalogPageTabs from './CatalogPageTabs';
import CatalogToolbar from './CatalogToolbar';
import CatalogTypeSelector from './CatalogTypeSelector';

type CatalogViewProps = {
  items: CatalogItem[];
  catalogType: string;
  catalogTypes: CatalogType[];
  categories?: CatalogCategory[];
  filters: FiltersType;
  filterGroups: string[];
  filterGroupMap: CatalogFilterGroupMap;
  groupings: CatalogStringMap;
  renderTile: (item: CatalogItem) => ReactNode;
  hideSidebar?: boolean;
  sortFilterGroups: boolean;
};

const CatalogView: FC<CatalogViewProps> = ({
  items,
  catalogType,
  catalogTypes,
  categories,
  filters,
  filterGroups,
  filterGroupMap,
  groupings,
  renderTile,
  hideSidebar,
  sortFilterGroups,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryParams = useQueryParams();
  const activeCategoryId = queryParams.get(CatalogQueryParams.CATEGORY) ?? ALL_CATEGORY;
  const activeSearchKeyword = queryParams.get(CatalogQueryParams.KEYWORD) ?? '';
  const activeGrouping = queryParams.get(CatalogQueryParams.GROUPING) ?? NO_GROUPING;
  const sortOrder =
    (queryParams.get(CatalogQueryParams.SORT_ORDER) as CatalogSortOrder) ??
    CatalogSortOrder.RELEVANCE;
  const activeFilters = useMemo(() => {
    const attributeFilters = {};

    _.each(filterGroups, (filterGroup) => {
      const attributeFilterParam = queryParams.get(filterGroup);
      try {
        _.set(attributeFilters, filterGroup, JSON.parse(attributeFilterParam));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('could not update filters from url params: could not parse search params', e);
      }
    });

    return getActiveFilters(attributeFilters, filters);
  }, [filterGroups, filters, queryParams]);

  const [filterGroupsShowAll, setFilterGroupsShowAll] = useState<Record<string, boolean>>({});
  const [filterGroupCounts, setFilterGroupCounts] = useState<CatalogFilterCounts>({});
  const [catalogTypeCounts, setCatalogTypeCounts] = useState<CatalogTypeCounts>({});

  const isGrouped = _.has(groupings, activeGrouping);

  const catalogToolbarRef = useRef<HTMLInputElement>();

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    catalogType && items.length > 0 && params.set('catalogType', catalogType);
    setURLParams(params, navigate);

    // Don't take focus if a modal was opened while the page was loading.
    if (!isModalOpen()) {
      catalogToolbarRef.current && catalogToolbarRef.current.focus({ preventScroll: true });
    }
  }, [catalogType, items.length, navigate]);

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      updateURLParams(CatalogQueryParams.CATEGORY, categoryId, navigate);
    },
    [navigate],
  );

  const handleFilterChange = useCallback(
    (filterType, id, value) => {
      const updatedFilters = _.set(activeFilters, [filterType, id, 'active'], value);
      updateURLParams(filterType, getFilterSearchParam(updatedFilters[filterType]), navigate);
    },
    [activeFilters, navigate],
  );

  const handleSearchKeywordChange = useCallback(
    (searchKeyword) => {
      updateURLParams(CatalogQueryParams.KEYWORD, searchKeyword, navigate);
    },
    [navigate],
  );

  const handleGroupingChange = useCallback(
    (grouping) => {
      updateURLParams(CatalogQueryParams.GROUPING, grouping, navigate);
    },
    [navigate],
  );

  const handleSortOrderChange = useCallback(
    (order) => {
      updateURLParams(CatalogQueryParams.SORT_ORDER, order, navigate);
    },
    [navigate],
  );

  const handleShowAllToggle = useCallback((groupName) => {
    setFilterGroupsShowAll((showAll) => {
      const updatedShowAll = _.clone(showAll);
      _.set(updatedShowAll, groupName, !(showAll[groupName] ?? false));
      return updatedShowAll;
    });
  }, []);

  const catalogCategories = useMemo<CatalogCategory[]>(() => {
    const allCategory = { id: ALL_CATEGORY, label: t('console-shared~All items') };
    const otherCategory = { id: OTHER_CATEGORY, label: t('console-shared~Other') };
    const sortedCategories = (categories ?? [])
      .filter((cat) => cat && cat.id !== ALL_CATEGORY && cat.id !== OTHER_CATEGORY)
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? '') ?? 0);
    return [allCategory, ...sortedCategories, otherCategory];
  }, [categories, t]);

  const categorizedIds = useMemo(() => categorize(items, catalogCategories), [
    catalogCategories,
    items,
  ]);

  const activeCategory = useMemo(
    () =>
      findActiveCategory(activeCategoryId, catalogCategories) ||
      findActiveCategory(ALL_CATEGORY, catalogCategories),
    [activeCategoryId, catalogCategories],
  );

  const filteredItems: CatalogItem[] = useMemo(() => {
    const filteredByCategoryItems = filterByCategory(items, activeCategoryId, categorizedIds);
    const filteredBySearchItems = filterBySearchKeyword(
      filteredByCategoryItems,
      activeSearchKeyword,
      sortOrder,
    );
    const filteredByAttributes = filterByAttributes(filteredBySearchItems, activeFilters);

    const filterCounts = getFilterGroupCounts(filteredBySearchItems, activeFilters, filterGroups);
    setFilterGroupCounts(filterCounts);

    const typeCounts = getCatalogTypeCounts(filteredBySearchItems, catalogTypes);
    setCatalogTypeCounts(typeCounts);

    // Console table for final filtered results (only for operators)
    if (filteredByAttributes.length > 0) {
      // Check if we have active filters beyond just search and category
      const hasAttributeFilters = Object.values(activeFilters).some((filterGroup) =>
        Object.values(filterGroup).some((filter) => filter.active),
      );

      // Only show console.table if we have search term or attribute filters
      if (activeSearchKeyword || hasAttributeFilters) {
        const REDHAT_PRIORITY = {
          EXACT_MATCH: 2,
          CONTAINS_REDHAT: 1,
          NON_REDHAT: 0,
        };

        const tableData = filteredByAttributes.map((item) => {
          // Ensure we have the scoring properties, calculate them if missing
          const relevanceScore = activeSearchKeyword
            ? (item as any).relevanceScore ??
              calculateCatalogItemRelevanceScore(activeSearchKeyword, item)
            : 'N/A (No search)';
          const redHatPriority = (item as any).redHatPriority ?? getRedHatPriority(item);

          return {
            Title: item.name || 'N/A',
            'Search Relevance Score': relevanceScore,
            'Is Red Hat Provider (Priority)':
              redHatPriority === REDHAT_PRIORITY.EXACT_MATCH
                ? `Exact Match (${REDHAT_PRIORITY.EXACT_MATCH})`
                : redHatPriority === REDHAT_PRIORITY.CONTAINS_REDHAT
                ? `Contains Red Hat (${REDHAT_PRIORITY.CONTAINS_REDHAT})`
                : `Non-Red Hat (${REDHAT_PRIORITY.NON_REDHAT})`,
            Provider: item.attributes?.provider || item.provider || 'N/A',
            Type: item.type || 'N/A',
          };
        });

        // Build filter description
        const activeFilterDescriptions = [];
        if (activeSearchKeyword) activeFilterDescriptions.push(`Search: "${activeSearchKeyword}"`);
        if (activeCategoryId !== 'all')
          activeFilterDescriptions.push(`Category: ${activeCategoryId}`);

        Object.entries(activeFilters).forEach(([filterType, filterGroup]) => {
          const activeFilterValues = Object.entries(filterGroup)
            .filter(([, filter]) => filter.active)
            .map(([, filter]) => filter.label || filter.value);
          if (activeFilterValues.length > 0) {
            activeFilterDescriptions.push(`${filterType}: [${activeFilterValues.join(', ')}]`);
          }
        });

        const filterDescription =
          activeFilterDescriptions.length > 0 ? activeFilterDescriptions.join(' + ') : 'No filters';

        // eslint-disable-next-line no-console
        console.log(
          `\n🎯 FINAL Catalog Results: ${filterDescription} (${filteredByAttributes.length} matches)`,
        );
        // eslint-disable-next-line no-console
        console.table(tableData);
      }
    }

    // Always use filteredByAttributes since keywordCompare handles both cases:
    // - With search terms: relevance scoring + Red Hat prioritization + filtering
    // - Without search terms: Red Hat prioritization + alphabetical sorting (no filtering)
    // The keywordCompare function is called by filterBySearchKeyword regardless of search term presence
    return filteredByAttributes;
  }, [
    activeCategoryId,
    activeFilters,
    activeSearchKeyword,
    catalogTypes,
    categorizedIds,
    filterGroups,
    items,
    sortOrder,
  ]);

  const totalItems = filteredItems.length;

  const showCategories = Object.keys(categorizedIds ?? {}).length > 2;

  const showFilters = useMemo(
    () =>
      filterGroups.length > 0 &&
      !_.isEmpty(activeFilters) &&
      Object.values(activeFilters).some((filterGroup) => Object.keys(filterGroup).length > 0),
    [activeFilters, filterGroups.length],
  );

  const showTypeSelector = useMemo(
    () =>
      !catalogType &&
      catalogTypes?.length > 1 &&
      Object.values(catalogTypeCounts).some((count) => count),
    [catalogType, catalogTypeCounts, catalogTypes],
  );

  const showSidebar = !hideSidebar && (showCategories || showFilters || showTypeSelector);

  const catalogItems = useMemo(() => {
    if (!isGrouped) return filteredItems;

    return _.groupBy(filteredItems, (item) => item.attributes?.[activeGrouping]) as {
      [key: string]: CatalogItem[];
    };
  }, [activeGrouping, filteredItems, isGrouped]);

  useEffect(() => {
    catalogToolbarRef.current && catalogToolbarRef.current.focus({ preventScroll: true });
  }, []);

  return (
    <PaneBody>
      <CatalogPage>
        {showSidebar && (
          <CatalogPageTabs>
            {showCategories && (
              <CatalogCategories
                categories={catalogCategories}
                categorizedIds={categorizedIds}
                selectedCategory={activeCategoryId}
                onSelectCategory={handleCategoryChange}
              />
            )}
            {showTypeSelector && (
              <CatalogTypeSelector
                catalogTypes={catalogTypes}
                catalogTypeCounts={catalogTypeCounts}
              />
            )}
            {showFilters && (
              <CatalogFilters
                activeFilters={activeFilters}
                filterGroupCounts={filterGroupCounts}
                filterGroupMap={filterGroupMap}
                filterGroupsShowAll={filterGroupsShowAll}
                onShowAllToggle={handleShowAllToggle}
                onFilterChange={handleFilterChange}
                sortFilterGroups={sortFilterGroups}
              />
            )}
          </CatalogPageTabs>
        )}
        <CatalogPageContent>
          <CatalogToolbar
            ref={catalogToolbarRef}
            title={activeCategory.label}
            totalItems={totalItems}
            searchKeyword={activeSearchKeyword}
            sortOrder={sortOrder}
            groupings={groupings}
            activeGrouping={activeGrouping}
            catalogType={catalogType}
            onGroupingChange={handleGroupingChange}
            onSortOrderChange={handleSortOrderChange}
            onSearchKeywordChange={handleSearchKeywordChange}
          />
          {totalItems > 0 ? (
            <CatalogGrid items={catalogItems} renderTile={renderTile} isGrouped={isGrouped} />
          ) : (
            <CatalogEmptyState onClear={clearFilters} />
          )}
        </CatalogPageContent>
      </CatalogPage>
    </PaneBody>
  );
};

export default CatalogView;
