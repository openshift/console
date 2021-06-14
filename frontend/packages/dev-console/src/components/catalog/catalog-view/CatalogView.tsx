import * as React from 'react';
import * as cx from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { isModalOpen } from '@console/internal/components/modals';
import { useQueryParams } from '@console/shared';
import { setURLParams, updateURLParams, getCatalogTypeCounts } from '../utils/catalog-utils';
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
import {
  CatalogCategory,
  CatalogFilterCounts,
  CatalogFilters as FiltersType,
  CatalogQueryParams,
  CatalogSortOrder,
  CatalogStringMap,
  CatalogType,
  CatalogTypeCounts,
} from '../utils/types';
import CatalogCategories from './CatalogCategories';
import CatalogEmptyState from './CatalogEmptyState';
import CatalogFilters from './CatalogFilters';
import CatalogGrid from './CatalogGrid';
import CatalogToolbar from './CatalogToolbar';
import CatalogTypeSelector from './CatalogTypeSelector';

type CatalogViewProps = {
  items: CatalogItem[];
  catalogType: string;
  catalogTypes: CatalogType[];
  categories?: CatalogCategory[];
  filters: FiltersType;
  filterGroups: string[];
  filterGroupNameMap: CatalogStringMap;
  groupings: CatalogStringMap;
  renderTile: (item: CatalogItem) => React.ReactNode;
  hideSidebar?: boolean;
};

const CatalogView: React.FC<CatalogViewProps> = ({
  items,
  catalogType,
  catalogTypes,
  categories,
  filters,
  filterGroups,
  filterGroupNameMap,
  groupings,
  renderTile,
  hideSidebar,
}) => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const activeCategoryId = queryParams.get(CatalogQueryParams.CATEGORY) ?? ALL_CATEGORY;
  const activeSearchKeyword = queryParams.get(CatalogQueryParams.KEYWORD) ?? '';
  const activeGrouping = queryParams.get(CatalogQueryParams.GROUPING) ?? NO_GROUPING;
  const sortOrder =
    (queryParams.get(CatalogQueryParams.SORT_ORDER) as CatalogSortOrder) ?? CatalogSortOrder.ASC;
  const activeFilters = React.useMemo(() => {
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

  const [filterGroupsShowAll, setFilterGroupsShowAll] = React.useState<Record<string, boolean>>({});
  const [filterGroupCounts, setFilterGroupCounts] = React.useState<CatalogFilterCounts>({});
  const [catalogTypeCounts, setCatalogTypeCounts] = React.useState<CatalogTypeCounts>({});

  const isGrouped = _.has(groupings, activeGrouping);

  const catalogToolbarRef = React.useRef<HTMLInputElement>();

  const itemsSorter = React.useCallback(
    (itemsToSort) => _.orderBy(itemsToSort, ({ name }) => name.toLowerCase(), [sortOrder]),
    [sortOrder],
  );

  const clearFilters = React.useCallback(() => {
    const params = new URLSearchParams();
    catalogType && items.length > 0 && params.set('catalogType', catalogType);
    setURLParams(params);

    // Don't take focus if a modal was opened while the page was loading.
    if (!isModalOpen()) {
      // this doesn't work right now because of issue with PF SearchInput
      catalogToolbarRef.current && catalogToolbarRef.current.focus({ preventScroll: true });
    }
  }, [catalogType, items.length]);

  const handleCategoryChange = (categoryId) => {
    updateURLParams(CatalogQueryParams.CATEGORY, categoryId);
  };

  const handleFilterChange = React.useCallback(
    (filterType, id, value) => {
      const updatedFilters = _.set(activeFilters, [filterType, id, 'active'], value);
      updateURLParams(filterType, getFilterSearchParam(updatedFilters[filterType]));
    },
    [activeFilters],
  );

  const handleSearchKeywordChange = React.useCallback((searchKeyword) => {
    updateURLParams(CatalogQueryParams.KEYWORD, searchKeyword);
  }, []);

  const handleGroupingChange = React.useCallback((grouping) => {
    updateURLParams(CatalogQueryParams.GROUPING, grouping);
  }, []);

  const handleSortOrderChange = React.useCallback((order) => {
    updateURLParams(CatalogQueryParams.SORT_ORDER, order);
  }, []);

  const handleShowAllToggle = React.useCallback((groupName) => {
    setFilterGroupsShowAll((showAll) => {
      const updatedShowAll = _.clone(showAll);
      _.set(updatedShowAll, groupName, !(showAll[groupName] ?? false));
      return updatedShowAll;
    });
  }, []);

  const catalogCategories = React.useMemo<CatalogCategory[]>(() => {
    const allCategory = { id: ALL_CATEGORY, label: t('devconsole~All items') };
    const otherCategory = { id: OTHER_CATEGORY, label: t('devconsole~Other') };
    return [allCategory, ...(categories ?? []), otherCategory];
  }, [categories, t]);

  const categorizedIds = React.useMemo(() => categorize(items, catalogCategories), [
    catalogCategories,
    items,
  ]);

  const activeCategory = React.useMemo(
    () =>
      findActiveCategory(activeCategoryId, catalogCategories) ||
      findActiveCategory(ALL_CATEGORY, catalogCategories),
    [activeCategoryId, catalogCategories],
  );

  const filteredItems: CatalogItem[] = React.useMemo(() => {
    const filteredByCategoryItems = filterByCategory(items, activeCategoryId, categorizedIds);
    const filteredBySearchItems = filterBySearchKeyword(
      filteredByCategoryItems,
      activeSearchKeyword,
    );
    const filteredByAttributes = filterByAttributes(filteredBySearchItems, activeFilters);

    const filterCounts = getFilterGroupCounts(filteredBySearchItems, activeFilters, filterGroups);
    setFilterGroupCounts(filterCounts);

    const typeCounts = getCatalogTypeCounts(filteredBySearchItems, catalogTypes);
    setCatalogTypeCounts(typeCounts);

    return itemsSorter(filteredByAttributes);
  }, [
    activeCategoryId,
    activeFilters,
    activeSearchKeyword,
    catalogTypes,
    categorizedIds,
    filterGroups,
    items,
    itemsSorter,
  ]);

  const totalItems = filteredItems.length;

  const showCategories = Object.keys(categorizedIds ?? {}).length > 2;

  const showFilters = React.useMemo(
    () =>
      filterGroups.length > 0 &&
      !_.isEmpty(activeFilters) &&
      Object.values(activeFilters).some((filterGroup) => Object.keys(filterGroup).length > 1),
    [activeFilters, filterGroups.length],
  );

  const showTypeSelector = React.useMemo(
    () =>
      !catalogType &&
      catalogTypes?.length > 1 &&
      Object.values(catalogTypeCounts).some((count) => count),
    [catalogType, catalogTypeCounts, catalogTypes],
  );

  const showSidebar = !hideSidebar && (showCategories || showFilters || showTypeSelector);

  const catalogItems = React.useMemo(() => {
    if (!isGrouped) return filteredItems;

    return _.groupBy(filteredItems, (item) => item.attributes?.[activeGrouping]);
  }, [activeGrouping, filteredItems, isGrouped]);

  React.useEffect(() => {
    catalogToolbarRef.current && catalogToolbarRef.current.focus({ preventScroll: true });
  }, []);

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
              catalogTypeCounts={catalogTypeCounts}
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
        <CatalogToolbar
          ref={catalogToolbarRef}
          title={activeCategory.label}
          totalItems={totalItems}
          searchKeyword={activeSearchKeyword}
          sortOrder={sortOrder}
          groupings={groupings}
          activeGrouping={activeGrouping}
          onGroupingChange={handleGroupingChange}
          onSortOrderChange={handleSortOrderChange}
          onSearchKeywordChange={handleSearchKeywordChange}
        />
        {totalItems > 0 ? (
          <CatalogGrid items={catalogItems} renderTile={renderTile} isGrouped={isGrouped} />
        ) : (
          <CatalogEmptyState onClear={clearFilters} />
        )}
      </div>
    </div>
  );
};

export default CatalogView;
