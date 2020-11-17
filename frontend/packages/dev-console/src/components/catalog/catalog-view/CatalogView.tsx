import * as React from 'react';
import * as _ from 'lodash';
import { CatalogItem } from '@console/plugin-sdk';
import { isModalOpen } from '@console/internal/components/modals';
import { updateURLParams } from '@console/internal/components/utils/tile-view-page';

import { categorizeItems, findActiveCategory } from '../utils/category-utils';
import { clearFilterURLParams, getActiveValuesFromURL } from '../utils/catalog-view-utils';
import {
  clearActiveFilters,
  defaultFilters,
  FilterTypes,
  getFilterGroupCounts,
  getFilterSearchParam,
  recategorizeItems,
  updateActiveFilters,
} from '../utils/filter-utils';
import { keywordCompare, NoGrouping } from '../utils/utils';
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
  const [categorizedItems, setCategorizedItems] = React.useState();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [activeFilters, setActiveFilters] = React.useState(defaultFilters);
  const [filterGroupsShowAll, setFilterGroupsShowAll] = React.useState({});
  const [sortOrder, setSortOrder] = React.useState<CatalogSortOrder>(CatalogSortOrder.ASC);
  const [activeGrouping, setActiveGrouping] = React.useState<string>(NoGrouping);

  const searchInputRef = React.useRef<HTMLInputElement>();

  const itemsSorter = React.useCallback(
    (itemsToSort) => _.orderBy(itemsToSort, ({ name }) => name.toLowerCase(), [sortOrder]),
    [sortOrder],
  );

  React.useEffect(() => {
    searchInputRef.current && searchInputRef.current.focus({ preventScroll: true });
  }, []);

  React.useEffect(() => {
    setCategorizedItems(categorizeItems(items, itemsSorter, availableCategories));
  }, [availableCategories, items, itemsSorter]);

  React.useEffect(() => {
    let unmounted = false;

    const activeValues = getActiveValuesFromURL(
      availableFilters,
      filterGroups,
      null,
      filterStoreKey,
      filterRetentionPreference,
    );

    if (!unmounted) {
      setActiveFilters(activeValues.activeFilters);
      setSelectedCategory(activeValues.selectedCategory);
      setCategorizedItems((prevCategorizedItems) =>
        recategorizeItems(
          items,
          itemsSorter,
          activeValues.activeFilters,
          keywordCompare,
          prevCategorizedItems,
        ),
      );
    }

    return () => {
      unmounted = true;
    };
  }, [
    availableFilters,
    filterGroups,
    filterRetentionPreference,
    filterStoreKey,
    items,
    itemsSorter,
  ]);

  const filterCounts = React.useMemo(
    () =>
      categorizedItems
        ? getFilterGroupCounts(
            items,
            itemsSorter,
            filterGroups,
            selectedCategory,
            activeFilters,
            categorizedItems,
            keywordCompare,
          )
        : null,
    [activeFilters, categorizedItems, filterGroups, items, itemsSorter, selectedCategory],
  );

  const activeCategory = React.useMemo(
    () =>
      findActiveCategory(selectedCategory, categorizedItems) ||
      findActiveCategory('all', categorizedItems),
    [categorizedItems, selectedCategory],
  );

  const showCategories = Object.keys(categorizedItems ?? {}).length !== 2;

  const showFilters = Object.keys(activeFilters).length > 1;

  const showSidebar = showCategories || showFilters || !catalogType;

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
    clearFilterURLParams(selectedCategory);

    const clearedFilters = clearActiveFilters(activeFilters, filterGroups);

    setActiveFilters(clearedFilters);

    // Don't take focus if a modal was opened while the page was loading.
    if (!isModalOpen()) {
      searchInputRef.current && searchInputRef.current.focus({ preventScroll: true });
    }

    storeFilters(clearedFilters);
  }, [activeFilters, filterGroups, selectedCategory, storeFilters]);

  const handleCategoryChange = React.useCallback((categoryId) => {
    updateURLParams(FilterTypes.category, categoryId);
    setSelectedCategory(categoryId);
  }, []);

  const handleFilterChange = React.useCallback(
    (filterType, id, value) => {
      if (filterType === FilterTypes.keyword) {
        updateURLParams(FilterTypes.keyword, `${value}`);
      } else {
        const groupFilter = _.cloneDeep(activeFilters[filterType]);
        _.set(groupFilter, [id, 'active'], value);
        updateURLParams(filterType, getFilterSearchParam(groupFilter));
      }

      const updatedFilters = updateActiveFilters(activeFilters, filterType, id, value);

      setActiveFilters(updatedFilters);

      setCategorizedItems((prevCategorizedItems) =>
        recategorizeItems(items, itemsSorter, updatedFilters, keywordCompare, prevCategorizedItems),
      );

      storeFilters(updatedFilters);
    },
    [activeFilters, items, itemsSorter, storeFilters],
  );

  const handleKeywordSearch = React.useCallback(
    (value) => handleFilterChange('keyword', null, value),
    [handleFilterChange],
  );

  const handleShowAllToggle = React.useCallback((groupName) => {
    setFilterGroupsShowAll((showAll) => {
      const updatedShowAll = _.clone(showAll);
      _.set(updatedShowAll, groupName, !_.get(showAll, groupName, false));
      return updatedShowAll;
    });
  }, []);

  const isGrouped = activeGrouping !== NoGrouping;

  const catalogItems = React.useMemo(() => {
    if (!isGrouped) return activeCategory?.items;

    return _.groupBy(activeCategory?.items, (item) => item.attributes?.[activeGrouping]);
  }, [activeCategory, activeGrouping, isGrouped]);

  return (
    <div className="co-catalog-page">
      {showSidebar && (
        <div className="co-catalog-page__tabs">
          {showCategories && (
            <CatalogCategories
              categories={categorizedItems}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
            />
          )}
          {!catalogType && catalogTypes && (
            <CatalogTypeSelector
              catalogTypes={catalogTypes}
              onCatalogTypeChange={onCatalogTypeChange}
            />
          )}
          {showFilters && (
            <CatalogFilters
              activeFilters={activeFilters}
              filterCounts={filterCounts}
              filterGroupNameMap={filterGroupNameMap}
              filterGroupsShowAll={filterGroupsShowAll}
              onShowAllToggle={handleShowAllToggle}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      )}
      <div className="co-catalog-page__content">
        {activeCategory && (
          <>
            <CatalogToolbar
              ref={searchInputRef}
              activeCategory={activeCategory}
              keyword={activeFilters.keyword.value}
              sortOrder={sortOrder}
              groupings={groupings}
              activeGrouping={activeGrouping}
              onGroupingChange={setActiveGrouping}
              onSortOrderChange={setSortOrder}
              onKeywordChange={handleKeywordSearch}
            />

            {activeCategory.numItems > 0 ? (
              <CatalogGrid items={catalogItems} renderTile={renderTile} isGrouped={isGrouped} />
            ) : (
              <CatalogEmptyState keyword={activeFilters.keyword.value} onClear={clearFilters} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CatalogView;
