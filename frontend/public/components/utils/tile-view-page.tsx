import type { ReactNode } from 'react';
import { useRef, useState, useCallback, useEffect } from 'react';
import * as _ from 'lodash';
import i18n from '@console/internal/i18n';
import { useTranslation } from 'react-i18next';
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
  VerticalTabs,
  VerticalTabsTab,
} from '@patternfly/react-catalog-view-extension';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  SearchInput,
  EmptyStateActions,
  EmptyStateFooter,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { VirtualizedGrid } from '@console/shared/src/components/virtualized-grid/VirtualizedGrid';
import { useDebounceCallback } from '@console/shared/src/hooks/useDebounceCallback';
import { getURLWithParams } from '@console/shared/src/components/catalog/utils/catalog-utils';
import { Link, useSearchParams } from 'react-router';
import { isModifiedEvent } from '@console/shared/src/utils/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import CatalogPage from '@console/shared/src/components/catalog/catalog-view/CatalogPage';
import CatalogPageContent from '@console/shared/src/components/catalog/catalog-view/CatalogPageContent';
import CatalogPageHeader from '@console/shared/src/components/catalog/catalog-view/CatalogPageHeader';
import CatalogPageHeading from '@console/shared/src/components/catalog/catalog-view/CatalogPageHeading';
import CatalogPageNumItems from '@console/shared/src/components/catalog/catalog-view/CatalogPageNumItems';
import CatalogPageTabs from '@console/shared/src/components/catalog/catalog-view/CatalogPageTabs';
import CatalogPageToolbar from '@console/shared/src/components/catalog/catalog-view/CatalogPageToolbar';

import { isModalOpen } from '../modals';

export const FilterTypes = {
  category: 'category',
  keyword: 'keyword',
} as const;

type FilterItem = {
  label: string;
  value: string;
  active: boolean;
  synonyms?: string[];
};

type KeywordFilter = {
  value: string;
  active: boolean;
};

type ActiveFilters = {
  keyword: KeywordFilter;
  [groupName: string]: Record<string, FilterItem> | KeywordFilter;
};

type TileItem = Record<string, unknown>;

type KeywordCompareResult = {
  matches: boolean;
  score: number;
  item: TileItem;
};

type Subcategory = {
  id: string;
  label: string;
  field?: string;
  values?: string[];
  items?: TileItem[];
  numItems?: number;
  subcategories?: Record<string, Subcategory>;
};

type Category = {
  id: string;
  label: string;
  field?: string;
  values?: string[];
  items?: TileItem[];
  numItems?: number;
  subcategories?: Record<string, Subcategory>;
};

type Categories = Record<string, Category>;

type FilterCounts = Record<string, Record<string, number>>;

type GroupByTypes = Record<string, string>;

type KeywordCompareFunction = {
  (filterString: string, item: TileItem): boolean | KeywordCompareResult;
  useScoring?: boolean;
};

type ItemsSorterFunction = {
  (items: TileItem[], searchTerm?: string): TileItem[];
  name?: string;
};

type TileViewPageProps = {
  items: TileItem[] | null;
  itemsSorter: ItemsSorterFunction;
  getAvailableCategories: (items: TileItem[]) => Record<string, Category>;
  getAvailableFilters?: (
    filters: ActiveFilters,
    items: TileItem[],
    filterGroups: string[],
  ) => ActiveFilters;
  filterGroups: string[];
  filterGroupNameMap?: Record<string, string>;
  renderFilterGroup?:
    | ((filterGroup: Record<string, FilterItem>, groupName: string) => ReactNode)
    | null;
  keywordCompare: KeywordCompareFunction;
  renderTile: (item: TileItem) => ReactNode;
  emptyStateTitle?: string;
  emptyStateInfo?: string;
  groupByTypes?: GroupByTypes;
};

const filterSubcategories = (category: Subcategory, item: TileItem): Subcategory[] => {
  if (!category.subcategories) {
    if (!category.values) {
      return [];
    }

    let values = _.get(item, category.field) as Subcategory['field'] | Subcategory['values'];
    if (!Array.isArray(values)) {
      values = [values];
    }

    const intersection = [category.values, values].reduce((a, b) => a.filter((c) => b.includes(c)));
    if (!_.isEmpty(intersection)) {
      return [category];
    }

    return [];
  }

  const matchedSubcategories: Subcategory[] = [];
  _.forOwn(category.subcategories, (subCategory) => {
    let values = _.get(item, category.field) as Subcategory['field'] | Subcategory['values'];

    if (!Array.isArray(values)) {
      values = [values];
    }

    const valuesIntersection = [subCategory.values, values].reduce((a, b) =>
      a.filter((c) => b.includes(c)),
    );
    if (!_.isEmpty(valuesIntersection)) {
      matchedSubcategories.push(subCategory, ...filterSubcategories(subCategory, item));
    }
  });

  return matchedSubcategories;
};

// categorize item under sub and main categories
const addItem = (item: TileItem, category: Category, subcategory: Subcategory | null = null) => {
  // Add the item to the category
  if (!category.items) {
    category.items = [item];
  } else if (!category.items.includes(item)) {
    category.items = category.items.concat(item);
  }

  // Add the item to the subcategory
  if (subcategory) {
    if (!subcategory.items) {
      subcategory.items = [item];
    } else if (!subcategory.items.includes(item)) {
      subcategory.items = subcategory.items.concat(item);
    }
  }
};

const processSubCategories = (category: Category, itemsSorter: ItemsSorterFunction) => {
  if (!category || !category.subcategories) {
    return;
  }

  _.forOwn(category.subcategories, (subcategory) => {
    if (subcategory && subcategory.items) {
      subcategory.numItems = _.size(subcategory.items);
      subcategory.items = itemsSorter(subcategory.items);
      processSubCategories(subcategory, itemsSorter);
    }
    if (category.subcategories && category.items) {
      _.each(category.items, (item) => {
        const included = _.find(_.keys(category.subcategories), (subcat) =>
          _.includes(category.subcategories[subcat].items, item),
        );
        if (!included) {
          let otherCategory = _.get(category.subcategories, 'other');
          if (!otherCategory) {
            otherCategory = { id: `${category.id}-other`, label: 'Other', items: [] };
            category.subcategories.other = otherCategory;
          }
          otherCategory.items.push(item);
        }
      });
    }
  });
};

// calculate numItems per Category and subcategories, sort items
const processCategories = (categories: Categories, itemsSorter: ItemsSorterFunction) => {
  if (!categories || !itemsSorter) {
    return;
  }

  _.forOwn(categories, (category) => {
    if (category && category.items) {
      category.numItems = _.size(category.items);
      category.items = itemsSorter(category.items);
      processSubCategories(category, itemsSorter);
    }
  });
};

const categorize = (items: TileItem[], categories: Categories) => {
  // Categorize each item
  _.each(items, (item) => {
    let itemCategorized = false;

    _.each(categories, (category) => {
      const matchedSubcategories = filterSubcategories(category, item);
      _.each(matchedSubcategories, (subcategory) => {
        addItem(item, category, subcategory); // add to subcategory & main category
        itemCategorized = true;
      });
    });
    if (!itemCategorized) {
      addItem(item, categories.other); // add to Other category
    }
  });

  // Ensure categories.all exists before setting properties
  if (categories.all) {
    categories.all.numItems = _.size(items);
    categories.all.items = items;
  } else {
    // Recreate the 'all' category if it was somehow deleted
    categories.all = {
      id: 'all',
      label: i18n.t('public~All Items'),
      numItems: _.size(items),
      items,
    };
  }
};

/**
 * Creates an items array under each category and subcategory.  If no match, categorizes item
 * under 'Other' main category.
 * (exported for test purposes)
 */
export const categorizeItems = (
  items: TileItem[],
  itemsSorter: ItemsSorterFunction,
  initCategories: Record<string, Category>,
): Categories => {
  const allCategory = { id: 'all', label: i18n.t('public~All Items') };
  const otherCategory = { id: 'other', label: i18n.t('public~Other') };

  const categories: Categories = {
    all: allCategory,
    ..._.cloneDeep(initCategories),
    other: otherCategory,
  };

  categorize(items, categories);
  // Don't prune categories - preserve all categories for navigation
  // Users should see all available categories even if they currently have 0 items
  // pruneCategoriesWithNoItems(categories);
  processCategories(categories, itemsSorter);

  return categories;
};

const clearItemsFromCategories = (categories: Categories) => {
  if (!categories) {
    return;
  }

  _.forOwn(categories, (category) => {
    if (category) {
      category.numItems = 0;
      category.items = [];
      if (category.subcategories) {
        clearItemsFromCategories(category.subcategories);
      }
    }
  });
};

const filterByKeyword = (
  items: TileItem[],
  filters: ActiveFilters,
  compFunction: KeywordCompareFunction,
) => {
  const { keyword } = filters;
  if (!keyword || !keyword.active) {
    return items;
  }

  const filterString = keyword.value.toLowerCase();

  if (compFunction.useScoring && window.location.pathname.includes('operatorhub')) {
    return items
      .map((item) => {
        const result = compFunction(filterString, item) as KeywordCompareResult;
        return result.matches ? result.item : null;
      })
      .filter((item) => item !== null);
  }

  return _.filter(items, (item) => compFunction(filterString, item));
};

// Filter items by each filter group
const filterByGroup = (items: TileItem[], filters: ActiveFilters) => {
  return _.reduce(
    filters,
    (filtered: Record<string, TileItem[]>, group, key) => {
      if (key === FilterTypes.keyword) {
        return filtered;
      }
      // Only apply active filters
      const activeFilters = _.filter(group as Record<string, FilterItem>, 'active');
      if (activeFilters.length) {
        const values = _.reduce(
          activeFilters,
          (filterValues: string[], filter) => {
            filterValues.push(filter.value, ..._.get(filter, 'synonyms', []));
            return filterValues;
          },
          [],
        );

        filtered[key] = _.filter(items, (item) => {
          const itemValue = item[key];
          if (Array.isArray(itemValue)) {
            return itemValue.some((f: string) => values.includes(f));
          }
          return values.includes(itemValue as string);
        });
      }

      return filtered;
    },
    {},
  );
};

const filterItems = (
  items: TileItem[],
  filters: ActiveFilters,
  keywordCompare: KeywordCompareFunction,
) => {
  if (_.isEmpty(filters)) {
    return items;
  }

  // Filter items by keyword first
  const filteredByKeyword = filterByKeyword(items, filters, keywordCompare);

  // Apply each filter property individually. Example:
  //  filteredByGroup = {
  //    provider: [/*array of items filtered by provider*/],
  //    healthIndex: [/*array of items filtered by healthIndex*/],
  //  };
  const filteredByGroup = filterByGroup(filteredByKeyword, filters);

  // Intersection of individually applied filters is all filters
  // In the case no filters are active, returns items filteredByKeyword
  return [..._.values(filteredByGroup), filteredByKeyword].reduce((a, b) =>
    a.filter((c) => b.includes(c)),
  );
};

const recategorizeItems = (
  items: TileItem[],
  itemsSorter: ItemsSorterFunction,
  filters: ActiveFilters,
  keywordCompare: KeywordCompareFunction,
  categories: Categories,
) => {
  const filteredItems = filterItems(items, filters, keywordCompare);

  const searchTerm = filters?.keyword?.active ? filters.keyword.value : '';

  const newCategories = _.cloneDeep(categories);
  clearItemsFromCategories(newCategories);

  categorize(filteredItems, newCategories);

  // Process the categories with search term for relevance sorting
  processCategories(newCategories, (categoryItems) => {
    // For OperatorHub, pass the search term to the sorter
    if (itemsSorter.name === 'orderAndSortByRelevance') {
      return itemsSorter(categoryItems, searchTerm);
    }
    return itemsSorter(categoryItems);
  });

  // Don't prune categories during filtering - preserve all categories for navigation
  // Users should see all available categories even if they currently have 0 items
  // pruneCategoriesWithNoItems(newCategories);

  return newCategories;
};

const isActiveTab = (activeId: string, category: Category) => {
  return _.has(category.subcategories, activeId);
};

const hasActiveDescendant = (activeId: string, category: Category): boolean => {
  if (_.has(category.subcategories, activeId)) {
    return true;
  }

  return _.some(category.subcategories, (subcategory) =>
    hasActiveDescendant(activeId, subcategory),
  );
};

const findActiveCategory = (activeId: string, categories: Categories): Category | null => {
  let activeCategory: Category | null = null;
  _.forOwn(categories, (category) => {
    if (activeCategory) {
      return;
    }

    if (category.id === activeId) {
      activeCategory = category;
    } else {
      activeCategory = findActiveCategory(activeId, category.subcategories as Categories);
    }
  });
  return activeCategory;
};

const determineAvailableFilters = (
  initialFilters: ActiveFilters,
  items: TileItem[],
  filterGroups: string[],
) => {
  const filters = _.cloneDeep(initialFilters);

  _.each(filterGroups, (field) => {
    _.each(items, (item) => {
      const value = item[field] as string;
      if (value) {
        _.set(filters, [field, value], {
          label: value,
          value,
          active: false,
        });
      }
    });
  });

  return filters;
};

const getActiveFilters = (
  keywordFilter: string | null,
  groupFilters: Record<string, string[]>,
  activeFilters: ActiveFilters,
  categoryFilter: string | null = null,
) => {
  activeFilters.keyword.value = keywordFilter || '';
  activeFilters.keyword.active = !!keywordFilter;
  if (categoryFilter) {
    // removing default and localstore filters if category filters are present over URL
    _.each(_.keys(activeFilters.kind), (key) =>
      _.set(activeFilters, ['kind', key, 'active'], false),
    );
  }

  _.forOwn(groupFilters, (filterValues, filterType) => {
    // removing default and localstore filters if Filters are present over URL
    _.each(_.keys(activeFilters[filterType]), (key) =>
      _.set(activeFilters, [filterType, key, 'active'], false),
    );
    _.each(filterValues, (filterValue) => {
      _.set(activeFilters, [filterType, filterValue, 'active'], true);
    });
  });

  return activeFilters;
};

export const updateActiveFilters = (
  activeFilters: ActiveFilters,
  filterType: string,
  id: string | null,
  value: string | boolean,
) => {
  if (filterType === FilterTypes.keyword) {
    _.set(activeFilters, 'keyword.value', value);
    _.set(activeFilters, 'keyword.active', !!value);
  } else {
    _.set(activeFilters, [filterType, id, 'active'], value);
  }

  return activeFilters;
};

const clearActiveFilters = (activeFilters: ActiveFilters, filterGroups: string[]) => {
  // Clear the keyword filter
  _.set(activeFilters, 'keyword.value', '');
  _.set(activeFilters, 'keyword.active', false);

  // Clear the group filters
  _.each(filterGroups, (field) => {
    _.each(_.keys(activeFilters[field]), (key) =>
      _.set(activeFilters, [field, key, 'active'], false),
    );
  });

  return activeFilters;
};

const defaultFilters: ActiveFilters = {
  keyword: {
    value: '',
    active: false,
  },
};

const getFilterGroupCounts = (
  items: TileItem[],
  itemsSorter: ItemsSorterFunction,
  filterGroups: string[],
  selectedCategoryId: string,
  filters: ActiveFilters,
  categories: Categories,
  keywordCompare: KeywordCompareFunction,
): FilterCounts => {
  // Filter only by keyword
  const filteredItems = filterByKeyword(items, filters, keywordCompare);

  const categoriesForCounts = recategorizeItems(
    filteredItems,
    itemsSorter,
    defaultFilters,
    keywordCompare,
    categories,
  );

  const activeCategory = findActiveCategory(selectedCategoryId, categoriesForCounts);
  const activeItems = activeCategory ? activeCategory.items : [];
  const newFilterCounts: FilterCounts = {};

  _.each(filterGroups, (filterGroup) => {
    _.each(_.keys(filters[filterGroup]), (key) => {
      const filterValues = [
        _.get(filters, [filterGroup, key, 'value']),
        ..._.get(filters, [filterGroup, key, 'synonyms'], []),
      ];

      const matchedItems = _.filter(activeItems, (item) => {
        if (Array.isArray(item[filterGroup])) {
          return item[filterGroup].some((f: string) => filterValues.includes(f));
        }

        return filterValues.includes(item[filterGroup]);
      });

      _.set(newFilterCounts, [filterGroup, key], _.size(matchedItems));
    });
  });

  return newFilterCounts;
};

const getActiveValuesFromURL = (
  availableFilters: ActiveFilters,
  filterGroups: string[],
  groupByTypes?: GroupByTypes,
) => {
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get(FilterTypes.category);
  const keywordFilter = searchParams.get(FilterTypes.keyword);
  const selectedCategoryId = categoryParam || 'all';
  let groupBy = '';
  if (groupByTypes) {
    groupBy = searchParams.get('groupBy') || groupByTypes.None;
  }
  const groupFilters: Record<string, string[]> = {};

  _.each(filterGroups, (filterGroup) => {
    const groupFilterParam = searchParams.get(filterGroup);
    if (!groupFilterParam) {
      return;
    }

    try {
      _.set(groupFilters, filterGroup, JSON.parse(groupFilterParam));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('could not update filters from url params: could not parse search params', e);
    }
  });

  const activeFilters = getActiveFilters(
    keywordFilter,
    groupFilters,
    availableFilters,
    categoryParam,
  );

  return { selectedCategoryId, activeFilters, groupBy };
};

export const getFilterSearchParam = (groupFilter: Record<string, FilterItem>) => {
  const activeValues = _.reduce(
    _.keys(groupFilter),
    (result: string[], typeKey) => {
      return groupFilter[typeKey].active ? result.concat(typeKey) : result;
    },
    [],
  );

  return _.isEmpty(activeValues) ? '' : JSON.stringify(activeValues);
};

type UpdatedState = {
  activeFilters: ActiveFilters;
  selectedCategoryId: string;
  categories: Categories;
  filterCounts: FilterCounts;
};

export const TileViewPage = ({
  items,
  itemsSorter,
  keywordCompare,
  filterGroups,
  filterGroupNameMap = {},
  getAvailableCategories,
  getAvailableFilters = determineAvailableFilters,
  groupByTypes,
  emptyStateTitle = 'No Results Match the Filter Criteria',
  emptyStateInfo = 'No items are being shown due to the filters being applied.',
  renderTile,
}: TileViewPageProps) => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const filterByKeywordInput = useRef<HTMLInputElement>(null);
  const [prevItems, setPrevItems] = useState(items);

  const [categories, setCategories] = useState(() =>
    categorizeItems(items, itemsSorter, getAvailableCategories(items)),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() =>
    _.cloneDeep(defaultFilters),
  );
  const [filterCounts, setFilterCounts] = useState<FilterCounts | null>(null);
  const [filterGroupsShowAll, setFilterGroupsShowAll] = useState<Record<string, boolean>>({});

  const updateURLParams = (paramName: string, value: string | string[]) => {
    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set(paramName, Array.isArray(value) ? JSON.stringify(value) : value);
    } else {
      params.delete(paramName);
    }
    setSearchParams(params);
  };

  const clearFilterURLParams = () => {
    const params = new URLSearchParams();

    if (selectedCategoryId) {
      params.set(FilterTypes.category, selectedCategoryId);
    }

    setSearchParams(params);
  };

  const getUpdatedState = useCallback(
    (
      selectedCategories: Categories,
      categoryId: string,
      filters: ActiveFilters,
    ): UpdatedState | undefined => {
      if (!items) {
        return;
      }

      const newCategories = recategorizeItems(
        items,
        itemsSorter,
        filters,
        keywordCompare,
        selectedCategories,
      );

      return {
        activeFilters: filters,
        selectedCategoryId: categoryId,
        categories: newCategories,
        filterCounts: getFilterGroupCounts(
          items,
          itemsSorter,
          filterGroups,
          categoryId,
          filters,
          newCategories,
          keywordCompare,
        ),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const applyState = (state: UpdatedState | undefined) => {
    if (!state) {
      return;
    }
    setCategories(state.categories);
    setSelectedCategoryId(state.selectedCategoryId);
    setActiveFilters(state.activeFilters);
    setFilterCounts(state.filterCounts);
  };

  const initState = () => {
    const availableFilters = getAvailableFilters(defaultFilters, items, filterGroups);
    const activeValues = getActiveValuesFromURL(availableFilters, filterGroups, groupByTypes);

    applyState(
      getUpdatedState(categories, activeValues.selectedCategoryId, activeValues.activeFilters),
    );

    filterByKeywordInput.current?.focus({ preventScroll: true });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(initState, []);

  useEffect(() => {
    if (!_.isEqual(items, prevItems)) {
      const availableFilters = getAvailableFilters(defaultFilters, items, filterGroups);
      const availableCategories = getAvailableCategories(items);
      const newCategories = categorizeItems(items, itemsSorter, availableCategories);

      const newActiveFilters = _.reduce(
        availableFilters,
        (updatedFilters: ActiveFilters, filterGroup, filterGroupName) => {
          if (filterGroupName === FilterTypes.keyword) {
            updatedFilters.keyword = activeFilters.keyword;
            return updatedFilters;
          }
          _.each(filterGroup as Record<string, FilterItem>, (filterItem, filterItemName) => {
            (updatedFilters[filterGroupName] as Record<string, FilterItem>)[
              filterItemName
            ].active = _.get(activeFilters, [filterGroupName, filterItemName, 'active'], false);
          });

          return updatedFilters;
        },
        availableFilters,
      );

      applyState(getUpdatedState(newCategories, selectedCategoryId, newActiveFilters));
    }

    setPrevItems(items);
  }, [
    filterGroups,
    getAvailableFilters,
    getUpdatedState,
    groupByTypes,
    items,
    activeFilters,
    getAvailableCategories,
    itemsSorter,
    selectedCategoryId,
    prevItems,
  ]);

  const clearFilters = () => {
    clearFilterURLParams();

    const clearedFilters = clearActiveFilters(activeFilters, filterGroups);

    applyState(getUpdatedState(categories, selectedCategoryId, clearedFilters));

    // Don't take focus if a modal was opened while the page was loading.
    if (!isModalOpen()) {
      filterByKeywordInput.current?.focus({ preventScroll: true });
    }
  };

  const selectCategory = (categoryId: string) => {
    updateURLParams(FilterTypes.category, categoryId);

    applyState(getUpdatedState(categories, categoryId, activeFilters));
  };

  const onFilterChange = (filterType: string, id: string | null, value: string | boolean) => {
    if (filterType === FilterTypes.keyword) {
      const update = _.debounce(() => updateURLParams(FilterTypes.keyword, `${value}`), 500);
      update();
    } else {
      const groupFilter = _.cloneDeep(activeFilters[filterType]) as Record<string, FilterItem>;
      _.set(groupFilter, [id, 'active'], value);
      updateURLParams(filterType, getFilterSearchParam(groupFilter));
    }

    const updatedFilters = updateActiveFilters(activeFilters, filterType, id, value);

    applyState(getUpdatedState(categories, selectedCategoryId, updatedFilters));
  };

  const onKeywordChange = useDebounceCallback((value: string) => {
    onFilterChange('keyword', null, value);
  });

  const onShowAllToggle = (groupName: string) => {
    const updatedShow = _.clone(filterGroupsShowAll);
    _.set(updatedShow, groupName, !_.get(filterGroupsShowAll, groupName, false));
    setFilterGroupsShowAll(updatedShow);
  };

  const renderTabs = (category: Category, selected: string): ReactNode => {
    const { id, label, subcategories } = category;
    const active = id === selected;
    const shown = id === 'all';

    return (
      <VerticalTabsTab
        key={id}
        active={active}
        hasActiveDescendant={hasActiveDescendant(selected, category)}
        shown={shown}
        data-test={id}
        component={() => (
          <Link
            to={getURLWithParams(FilterTypes.category, id)}
            onClick={(e) => {
              if (isModifiedEvent(e)) {
                return;
              }
              e.preventDefault();
              selectCategory(id);
            }}
          >
            {label}
          </Link>
        )}
      >
        {subcategories && (
          <VerticalTabs restrictTabs activeTab={isActiveTab(selected, category)}>
            {_.map(subcategories, (subcategory) => renderTabs(subcategory, selected))}
          </VerticalTabs>
        )}
      </VerticalTabsTab>
    );
  };

  const renderCategoryTabs = (selected: string) => {
    const activeTab = _.has(categories, selected);

    return (
      <VerticalTabs restrictTabs activeTab={activeTab}>
        {_.map(categories, (category) => renderTabs(category, selected))}
      </VerticalTabs>
    );
  };

  const renderFilterGroup = (filterGroup: Record<string, FilterItem>, groupName: string) => {
    const maxShown = 5;
    const showMoreText = t('public~Show {{numRemaining}} more', {
      numRemaining: Object.keys(filterGroup).length - maxShown,
    });

    return (
      <FilterSidePanelCategory
        key={groupName}
        title={filterGroupNameMap[groupName] || groupName}
        onShowAllToggle={() => onShowAllToggle(groupName)}
        showAll={_.get(filterGroupsShowAll, groupName, false)}
        data-test-group-name={groupName}
        maxShowCount={maxShown}
        showText={showMoreText}
        hideText={t('public~Show less')}
      >
        {_.map(filterGroup, (filter, filterName) => {
          const { label, active } = filter;
          return (
            <FilterSidePanelCategoryItem
              key={filterName}
              count={_.get(filterCounts, [groupName, filterName], 0)}
              checked={active}
              onClick={(e) =>
                onFilterChange(groupName, filterName, (e.target as HTMLInputElement).checked)
              }
              title={label}
              data-test={`${groupName}-${_.kebabCase(filterName)}`}
            >
              {label}
            </FilterSidePanelCategoryItem>
          );
        })}
      </FilterSidePanelCategory>
    );
  };

  const renderSidePanel = () => {
    return (
      <FilterSidePanel>
        {_.map(activeFilters, (filterGroup, groupName) => {
          if (groupName === FilterTypes.keyword) {
            return;
          }
          return renderFilterGroup(filterGroup as Record<string, FilterItem>, groupName);
        })}
      </FilterSidePanel>
    );
  };

  const renderEmptyState = () => {
    return (
      <EmptyState
        headingLevel="h2"
        titleText={<>{emptyStateTitle}</>}
        variant={EmptyStateVariant.full}
      >
        <EmptyStateBody>{emptyStateInfo}</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button
              variant="link"
              onClick={() => clearFilters()}
              data-test-id="catalog-clear-filters"
            >
              {i18n.t('public~Clear All Filters')}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    );
  };

  let activeCategory = findActiveCategory(selectedCategoryId, categories);
  if (!activeCategory) {
    activeCategory = findActiveCategory('all', categories);
  }

  if (!activeCategory) {
    activeCategory = { id: 'all', label: 'All Items', numItems: 0, items: [] };
  }
  if (typeof activeCategory.numItems !== 'number') {
    activeCategory.numItems = 0;
  }
  if (!Array.isArray(activeCategory.items)) {
    activeCategory.items = [];
  }

  const numItems = t('public~{{totalItems}} items', {
    totalItems: activeCategory.numItems,
  });

  return (
    <PaneBody>
      <CatalogPage>
        <CatalogPageTabs>
          {renderCategoryTabs(activeCategory.id)}
          {renderSidePanel()}
        </CatalogPageTabs>
        <CatalogPageContent>
          <CatalogPageHeader>
            <CatalogPageHeading>{activeCategory.label}</CatalogPageHeading>
            <CatalogPageToolbar>
              <Flex alignItems={{ default: 'alignItemsBaseline' }}>
                <FlexItem>
                  <SearchInput
                    data-test="search-operatorhub"
                    ref={filterByKeywordInput}
                    placeholder={t('public~Filter by keyword...')}
                    value={activeFilters.keyword.value}
                    onChange={(event, text) => onKeywordChange(text)}
                    onClear={() => onKeywordChange('')}
                    aria-label={t('public~Filter by keyword...')}
                  />
                </FlexItem>
              </Flex>
              <CatalogPageNumItems>{numItems}</CatalogPageNumItems>
            </CatalogPageToolbar>
          </CatalogPageHeader>

          {activeCategory.numItems > 0 && (
            <VirtualizedGrid items={activeCategory.items} renderCell={renderTile} />
          )}
          {activeCategory.numItems === 0 && renderEmptyState()}
        </CatalogPageContent>
      </CatalogPage>
    </PaneBody>
  );
};

TileViewPage.displayName = 'TileViewPage';
