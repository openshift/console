import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
import { CatalogItem } from '@console/plugin-sdk';
import { isModalOpen } from '@console/internal/components/modals';

import { categorize, findActiveCategory } from '../utils/category-utils';
import { setURLParams, updateURLParams, NoGrouping } from '../utils/catalog-utils';
import {
  clearActiveFilters,
  filterByAttributes,
  filterByCategory,
  filterBySearchKeyword,
  getActiveFilters,
  getFilterGroupCounts,
  getFilterSearchParam,
  updateActiveFilters,
} from '../utils/filter-utils';

import {
  CatalogCategories as CategoriesType,
  CatalogFilters as FiltersType,
  CatalogSortOrder,
  CatalogStringMap,
  CatalogType,
} from '../utils/types';

import CatalogFilters from './CatalogFilters';
import CatalogToolbar from './CatalogToolbar';
import CatalogGrid from './CatalogGrid';
import CatalogCategories from './CatalogCategories';
import CatalogEmptyState from './CatalogEmptyState';
import CatalogTypeSelector from './CatalogTypeSelector';

type CatalogViewProps = {
  items: CatalogItem[];
  catalogType: string;
  catalogTypes: CatalogType[];
  onCatalogTypeChange: (type: string) => void;
  availableCategories: CategoriesType;
  availableFilters: FiltersType;
  filterGroups: string[];
  filterGroupNameMap: CatalogStringMap;
  filterStoreKey: string;
  filterRetentionPreference: string[];
  groupings: CatalogStringMap;
  renderTile: (item: CatalogItem) => React.ReactNode;
};

const CatalogView: React.FC<CatalogViewProps> = ({
  items,
  catalogType,
  catalogTypes,
  onCatalogTypeChange,
  availableCategories,
  availableFilters,
  filterGroups,
  filterGroupNameMap,
  filterStoreKey,
  filterRetentionPreference,
  groupings,
  renderTile,
}) => {
  const [activeCategoryId, setActiveCategoryId] = React.useState<string>('all');
  const [activeSearchKeyword, setActiveSearchKeyword] = React.useState<string>('');
  const [activeFilters, setActiveFilters] = React.useState<FiltersType>();
  const [activeGrouping, setActiveGrouping] = React.useState<string>(NoGrouping);
  const [filterGroupsShowAll, setFilterGroupsShowAll] = React.useState({});
  const [sortOrder, setSortOrder] = React.useState<CatalogSortOrder>(CatalogSortOrder.ASC);
  const [filterGroupCounts, setFilterGroupCounts] = React.useState(null);

  const isGrouped = activeGrouping !== NoGrouping;

  const searchInputRef = React.useRef<HTMLInputElement>();

  const itemsSorter = React.useCallback(
    (itemsToSort) => _.orderBy(itemsToSort, ({ name }) => name.toLowerCase(), [sortOrder]),
    [sortOrder],
  );

  const storeFilters = React.useCallback(
    (filters) => {
      if (filterStoreKey && filterRetentionPreference) {
        const filtersToStore = {};
        _.each(filterRetentionPreference, (filterGroup) => {
          if (filters[filterGroup]) {
            filtersToStore[filterGroup] = filters[filterGroup];
          }
        });
        localStorage.setItem(filterStoreKey, JSON.stringify(filtersToStore));
      }
    },
    [filterRetentionPreference, filterStoreKey],
  );

  const clearFilters = React.useCallback(() => {
    const params = new URLSearchParams();
    activeCategoryId && params.set('category', activeCategoryId);
    catalogType && items.length > 0 && params.set('catalogType', catalogType);
    setURLParams(params);

    const clearedFilters = clearActiveFilters(activeFilters, filterGroups);

    setActiveSearchKeyword('');
    setActiveFilters(clearedFilters);

    // Don't take focus if a modal was opened while the page was loading.
    if (!isModalOpen()) {
      // this doesn't work right now because of issue with PF SearchInput
      searchInputRef.current && searchInputRef.current.focus({ preventScroll: true });
    }

    storeFilters(clearedFilters);
  }, [activeCategoryId, activeFilters, catalogType, filterGroups, items.length, storeFilters]);

  const handleCategoryChange = React.useCallback((categoryId) => {
    updateURLParams('category', categoryId);
    setActiveCategoryId(categoryId);
  }, []);

  const handleFilterChange = React.useCallback(
    (filterType, id, value) => {
      setActiveFilters((oldFilters) => {
        const updatedFilters = updateActiveFilters(oldFilters, filterType, id, value);
        updateURLParams(filterType, getFilterSearchParam(updatedFilters[filterType]));
        storeFilters(updatedFilters);
        return updatedFilters;
      });
    },
    [storeFilters],
  );

  const handleSearchKeywordChange = React.useCallback((searchKeyword) => {
    updateURLParams('keyword', searchKeyword);
    setActiveSearchKeyword(searchKeyword);
  }, []);

  const handleGroupingChange = React.useCallback((grouping) => {
    updateURLParams('grouping', grouping);
    setActiveGrouping(grouping);
  }, []);

  const handleShowAllToggle = React.useCallback((groupName) => {
    setFilterGroupsShowAll((showAll) => {
      const updatedShowAll = _.clone(showAll);
      _.set(updatedShowAll, groupName, !_.get(showAll, groupName, false));
      return updatedShowAll;
    });
  }, []);

  const catalogCategories = React.useMemo(() => {
    const allCategory = { id: 'all', label: 'All Items' };
    const otherCategory = { id: 'other', label: 'Other' };

    return {
      all: allCategory,
      ...availableCategories,
      other: otherCategory,
    };
  }, [availableCategories]);

  const categorizedIds = React.useMemo(() => categorize(items, catalogCategories), [
    catalogCategories,
    items,
  ]);

  const activeCategory = React.useMemo(
    () =>
      findActiveCategory(activeCategoryId, catalogCategories) ||
      findActiveCategory('all', catalogCategories),
    [activeCategoryId, catalogCategories],
  );

  const filteredItems: CatalogItem[] = React.useMemo(() => {
    const filteredByCategoryItems = filterByCategory(items, activeCategoryId, categorizedIds);
    const filteredBySearchItems = filterBySearchKeyword(
      filteredByCategoryItems,
      activeSearchKeyword,
    );
    const filteredByAttributes = filterByAttributes(filteredBySearchItems, activeFilters);

    const counts = getFilterGroupCounts(filteredBySearchItems, activeFilters, filterGroups);
    setFilterGroupCounts(counts);

    return itemsSorter(filteredByAttributes);
  }, [
    activeCategoryId,
    activeFilters,
    activeSearchKeyword,
    categorizedIds,
    filterGroups,
    items,
    itemsSorter,
  ]);

  const totalItems = filteredItems.length;

  const showCategories = Object.keys(categorizedIds ?? {}).length > 2;

  const showFilters = React.useMemo(
    () =>
      !_.isEmpty(activeFilters) &&
      Object.values(activeFilters).some((filterGroup) => Object.keys(filterGroup).length > 1),
    [activeFilters],
  );

  const showTypeSelector = !catalogType && catalogTypes?.length > 1;

  const showSidebar = showCategories || showFilters || showTypeSelector;

  const catalogItems = React.useMemo(() => {
    if (!isGrouped) return filteredItems;

    return _.groupBy(filteredItems, (item) => item.attributes?.[activeGrouping]);
  }, [activeGrouping, filteredItems, isGrouped]);

  React.useEffect(() => {
    let unmounted = false;
    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = searchParams.get('category');
    const keywordParam = searchParams.get('keyword');
    const groupingParam = searchParams.get('grouping');
    const attributeFilters = {};

    _.each(filterGroups, (filterGroup) => {
      const attributeFilterParam = searchParams.get(filterGroup);
      try {
        _.set(attributeFilters, filterGroup, JSON.parse(attributeFilterParam));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('could not update filters from url params: could not parse search params', e);
      }
    });

    const newFilters = getActiveFilters(
      attributeFilters,
      availableFilters,
      filterStoreKey,
      filterRetentionPreference,
    );

    if (!unmounted) {
      categoryParam && setActiveCategoryId(categoryParam);
      keywordParam && setActiveSearchKeyword(keywordParam);
      groupingParam && setActiveGrouping(groupingParam);
      newFilters && setActiveFilters(newFilters);
    }

    // this doesn't work right now because of issue with PF SearchInput
    searchInputRef.current && searchInputRef.current.focus({ preventScroll: true });

    return () => {
      unmounted = true;
    };
  }, [availableFilters, filterGroups, filterRetentionPreference, filterStoreKey]);

  return (
    <div className={cx('co-catalog-page', { 'co-catalog-page--with-sidebar': showSidebar })}>
      {showSidebar && (
        <div className="co-catalog-page__tabs">
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
              onCatalogTypeChange={onCatalogTypeChange}
            />
          )}
          {showFilters && (
            <CatalogFilters
              activeFilters={activeFilters}
              filterGroupCounts={filterGroupCounts}
              filterGroupNameMap={filterGroupNameMap}
              filterGroupsShowAll={filterGroupsShowAll}
              onShowAllToggle={handleShowAllToggle}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      )}
      <div className="co-catalog-page__content">
        <>
          <CatalogToolbar
            ref={searchInputRef}
            title={activeCategory.label}
            totalItems={totalItems}
            searchKeyword={activeSearchKeyword}
            sortOrder={sortOrder}
            groupings={groupings}
            activeGrouping={activeGrouping}
            onGroupingChange={handleGroupingChange}
            onSortOrderChange={setSortOrder}
            onSearchKeywordChange={handleSearchKeywordChange}
          />

          {totalItems > 0 ? (
            <CatalogGrid items={catalogItems} renderTile={renderTile} isGrouped={isGrouped} />
          ) : (
            <CatalogEmptyState onClear={clearFilters} />
          )}
        </>
      </div>
    </div>
  );
};

export default CatalogView;
