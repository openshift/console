import * as React from 'react';
import * as _ from 'lodash-es';
import i18n from '@console/internal/i18n';
import { useTranslation } from 'react-i18next';
import * as PropTypes from 'prop-types';
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
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  SearchInput,
  Title,
} from '@patternfly/react-core';
import { getURLWithParams, VirtualizedGrid } from '@console/shared';
import { Link } from 'react-router-dom';
import { isModifiedEvent } from '@console/shared/src/utils';

import { history } from './router';
import { isModalOpen } from '../modals';
import { Dropdown } from '../utils';

export const FilterTypes = {
  category: 'category',
  keyword: 'keyword',
};

const filterSubcategories = (category, item) => {
  if (!category.subcategories) {
    if (!category.values) {
      return [];
    }

    let values = _.get(item, category.field);
    if (!Array.isArray(values)) {
      values = [values];
    }

    const intersection = [category.values, values].reduce((a, b) => a.filter((c) => b.includes(c)));
    if (!_.isEmpty(intersection)) {
      return [category];
    }

    return [];
  }

  const matchedSubcategories = [];
  _.forOwn(category.subcategories, (subCategory) => {
    let values = _.get(item, category.field);

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
const addItem = (item, category, subcategory = null) => {
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

const isCategoryEmpty = ({ items }) => _.isEmpty(items);

const pruneCategoriesWithNoItems = (categories) => {
  if (!categories) {
    return;
  }

  _.forOwn(categories, (category, key) => {
    if (isCategoryEmpty(category)) {
      delete categories[key];
    } else {
      pruneCategoriesWithNoItems(category.subcategories);
    }
  });
};

const processSubCategories = (category, itemsSorter) => {
  _.forOwn(category.subcategories, (subcategory) => {
    if (subcategory.items) {
      subcategory.numItems = _.size(subcategory.items);
      subcategory.items = itemsSorter(subcategory.items);
      processSubCategories(subcategory, itemsSorter);
    }
    if (category.subcategories) {
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
const processCategories = (categories, itemsSorter) => {
  _.forOwn(categories, (category) => {
    if (category.items) {
      category.numItems = _.size(category.items);
      category.items = itemsSorter(category.items);
      processSubCategories(category, itemsSorter);
    }
  });
};

const categorize = (items, categories) => {
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

  categories.all.numItems = _.size(items);
  categories.all.items = items;
};

/**
 * Creates an items array under each category and subcategory.  If no match, categorizes item
 * under 'Other' main category.
 * (exported for test purposes)
 */
export const categorizeItems = (items, itemsSorter, initCategories) => {
  const allCategory = { id: 'all', label: i18n.t('public~All Items') };
  const otherCategory = { id: 'other', label: i18n.t('public~Other') };

  const categories = {
    all: allCategory,
    ..._.cloneDeep(initCategories),
    other: otherCategory,
  };

  categorize(items, categories);
  pruneCategoriesWithNoItems(categories);
  processCategories(categories, itemsSorter);

  return categories;
};

const clearItemsFromCategories = (categories) => {
  _.forOwn(categories, (category) => {
    category.numItems = 0;
    category.items = [];
    clearItemsFromCategories(category.subcategories);
  });
};

const filterByKeyword = (items, filters, compFunction) => {
  const { keyword } = filters;
  if (!keyword || !keyword.active) {
    return items;
  }

  const filterString = keyword.value.toLowerCase();
  return _.filter(items, (item) => compFunction(filterString, item));
};

const filterByGroup = (items, filters) => {
  // Filter items by each filter group
  return _.reduce(
    filters,
    (filtered, group, key) => {
      if (key === FilterTypes.keyword) {
        return filtered;
      }
      // Only apply active filters
      const activeFilters = _.filter(group, 'active');
      if (activeFilters.length) {
        const values = _.reduce(
          activeFilters,
          (filterValues, filter) => {
            filterValues.push(filter.value, ..._.get(filter, 'synonyms', []));
            return filterValues;
          },
          [],
        );

        filtered[key] = _.filter(items, (item) => {
          if (Array.isArray(item[key])) {
            return item[key].some((f) => values.includes(f));
          }
          return values.includes(item[key]);
        });
      }

      return filtered;
    },
    {},
  );
};

const filterItems = (items, filters, keywordCompare) => {
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

const recategorizeItems = (items, itemsSorter, filters, keywordCompare, categories) => {
  const filteredItems = filterItems(items, filters, keywordCompare);

  const newCategories = _.cloneDeep(categories);
  clearItemsFromCategories(newCategories);

  categorize(filteredItems, newCategories);
  processCategories(newCategories, itemsSorter);

  return newCategories;
};

const isActiveTab = (activeId, category) => {
  return _.has(category.subcategories, activeId);
};

const hasActiveDescendant = (activeId, category) => {
  if (_.has(category.subcategories, activeId)) {
    return true;
  }

  return _.some(category.subcategories, (subcategory) =>
    hasActiveDescendant(activeId, subcategory),
  );
};

const findActiveCategory = (activeId, categories) => {
  let activeCategory = null;
  _.forOwn(categories, (category) => {
    if (activeCategory) {
      return;
    }

    if (category.id === activeId) {
      activeCategory = category;
    } else {
      activeCategory = findActiveCategory(activeId, category.subcategories);
    }
  });
  return activeCategory;
};

const determineAvailableFilters = (initialFilters, items, filterGroups) => {
  const filters = _.cloneDeep(initialFilters);

  _.each(filterGroups, (field) => {
    _.each(items, (item) => {
      const value = item[field];
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

const getActiveFilters = (keywordFilter, groupFilters, activeFilters, categoryFilter = null) => {
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

export const updateActiveFilters = (activeFilters, filterType, id, value) => {
  if (filterType === FilterTypes.keyword) {
    _.set(activeFilters, 'keyword.value', value);
    _.set(activeFilters, 'keyword.active', !!value);
  } else {
    _.set(activeFilters, [filterType, id, 'active'], value);
  }

  return activeFilters;
};

const clearActiveFilters = (activeFilters, filterGroups) => {
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

const getFilterGroupCounts = (
  items,
  itemsSorter,
  filterGroups,
  selectedCategoryId,
  filters,
  categories,
  keywordCompare,
) => {
  // Filter only by keyword
  const filteredItems = filterByKeyword(items, filters, keywordCompare);

  const categoriesForCounts = recategorizeItems(
    filteredItems,
    itemsSorter,
    [],
    keywordCompare,
    categories,
  );

  const activeCategory = findActiveCategory(selectedCategoryId, categoriesForCounts);
  const activeItems = activeCategory ? activeCategory.items : [];
  const newFilterCounts = {};

  _.each(filterGroups, (filterGroup) => {
    _.each(_.keys(filters[filterGroup]), (key) => {
      const filterValues = [
        _.get(filters, [filterGroup, key, 'value']),
        ..._.get(filters, [filterGroup, key, 'synonyms'], []),
      ];

      const matchedItems = _.filter(activeItems, (item) => {
        if (Array.isArray(item[filterGroup])) {
          return item[filterGroup].some((f) => filterValues.includes(f));
        }

        return filterValues.includes(item[filterGroup]);
      });

      _.set(newFilterCounts, [filterGroup, key], _.size(matchedItems));
    });
  });

  return newFilterCounts;
};

const setURLParams = (params) => {
  const location = window.location;
  const url = new URL(location);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export const updateURLParams = (paramName, value) => {
  const params = new URLSearchParams(window.location.search);

  if (value) {
    params.set(paramName, Array.isArray(value) ? JSON.stringify(value) : value);
  } else {
    params.delete(paramName);
  }
  setURLParams(params);
};

const clearFilterURLParams = (selectedCategoryId) => {
  const params = new URLSearchParams();

  if (selectedCategoryId) {
    params.set(FilterTypes.category, selectedCategoryId);
  }

  setURLParams(params);
};

const getActiveValuesFromURL = (availableFilters, filterGroups, groupByTypes) => {
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get(FilterTypes.category);
  const keywordFilter = searchParams.get(FilterTypes.keyword);
  const selectedCategoryId = categoryParam || 'all';
  let groupBy = '';
  if (groupByTypes) {
    groupBy = searchParams.get('groupBy') || groupByTypes.None;
  }
  const groupFilters = {};

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

export const getFilterSearchParam = (groupFilter) => {
  const activeValues = _.reduce(
    _.keys(groupFilter),
    (result, typeKey) => {
      return groupFilter[typeKey].active ? result.concat(typeKey) : result;
    },
    [],
  );

  return _.isEmpty(activeValues) ? '' : JSON.stringify(activeValues);
};

const defaultFilters = {
  keyword: {
    value: '',
    active: false,
  },
};

export const TileViewPage = (props) => {
  const {
    items,
    itemsSorter,
    keywordCompare,
    filterGroups,
    filterGroupNameMap,
    getAvailableCategories,
    getAvailableFilters,
    groupByTypes,
    emptyStateTitle,
    emptyStateInfo,
    renderTile,
    groupItems,
  } = props;

  const { t } = useTranslation();
  const filterByKeywordInput = React.useRef();
  const [prevProps, setPrevProps] = React.useState(props);

  const [categories, setCategories] = React.useState(
    categorizeItems(items, itemsSorter, getAvailableCategories(items)),
  );
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('all');
  const [activeFilters, setActiveFilters] = React.useState(defaultFilters);
  const [filterCounts, setFilterCounts] = React.useState(null);
  const [filterGroupsShowAll, setFilterGroupsShowAll] = React.useState({});
  const [groupBy, setGroupBy] = React.useState(groupByTypes ? groupByTypes.None : '');

  const getUpdatedState = React.useCallback((selectedCategories, categoryId, filters) => {
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
  }, []);

  const initState = () => {
    const availableFilters = getAvailableFilters(defaultFilters, items, filterGroups);
    const activeValues = getActiveValuesFromURL(availableFilters, filterGroups, groupByTypes);

    const updatedState = getUpdatedState(
      categories,
      activeValues.selectedCategoryId,
      activeValues.activeFilters,
    );

    setCategories(updatedState.categories);
    setSelectedCategoryId(updatedState.selectedCategoryId);
    setActiveFilters(updatedState.activeFilters);
    setFilterCounts(updatedState.filterCounts);
    setGroupBy(activeValues?.groupBy);

    filterByKeywordInput.current.focus({ preventScroll: true });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(initState, []);

  React.useEffect(() => {
    if (!_.isEqual(items, prevProps?.items)) {
      const availableFilters = getAvailableFilters(defaultFilters, items, filterGroups);
      const availableCategories = getAvailableCategories(items);
      const newCategories = categorizeItems(items, itemsSorter, availableCategories);

      const newActiveFilters = _.reduce(
        availableFilters,
        (updatedFilters, filterGroup, filterGroupName) => {
          if (filterGroupName === FilterTypes.keyword) {
            updatedFilters.keyword = activeFilters.keyword;
            return updatedFilters;
          }
          _.each(filterGroup, (filterItem, filterItemName) => {
            updatedFilters[filterGroupName][filterItemName].active = _.get(
              activeFilters,
              [filterGroupName, filterItemName, 'active'],
              false,
            );
          });

          return updatedFilters;
        },
        availableFilters,
      );

      const updatedState = getUpdatedState(newCategories, selectedCategoryId, newActiveFilters);

      setCategories(updatedState.categories);
      setSelectedCategoryId(updatedState.selectedCategoryId);
      setActiveFilters(updatedState.activeFilters);
      setFilterCounts(updatedState.filterCounts);
    }

    setPrevProps(props);
  }, [
    props,
    filterGroups,
    getAvailableFilters,
    getUpdatedState,
    groupByTypes,
    items,
    activeFilters,
    getAvailableCategories,
    itemsSorter,
    selectedCategoryId,
    prevProps?.items,
  ]);

  const clearFilters = () => {
    clearFilterURLParams(selectedCategoryId);

    const clearedFilters = clearActiveFilters(activeFilters, filterGroups);

    const updatedState = getUpdatedState(categories, selectedCategoryId, clearedFilters);

    setCategories(updatedState.categories);
    setSelectedCategoryId(updatedState.selectedCategoryId);
    setActiveFilters(updatedState.activeFilters);
    setFilterCounts(updatedState.filterCounts);

    // Don't take focus if a modal was opened while the page was loading.
    if (!isModalOpen()) {
      filterByKeywordInput.current.focus({ preventScroll: true });
    }
  };

  const selectCategory = (categoryId) => {
    updateURLParams(FilterTypes.category, categoryId);

    const updatedState = getUpdatedState(categories, categoryId, activeFilters);

    setCategories(updatedState.categories);
    setSelectedCategoryId(updatedState.selectedCategoryId);
    setActiveFilters(updatedState.activeFilters);
    setFilterCounts(updatedState.filterCounts);
  };

  const onFilterChange = (filterType, id, value) => {
    if (filterType === FilterTypes.keyword) {
      const update = _.debounce(() => updateURLParams(FilterTypes.keyword, `${value}`), 500);
      update();
    } else {
      const groupFilter = _.cloneDeep(activeFilters[filterType]);
      _.set(groupFilter, [id, 'active'], value);
      updateURLParams(filterType, getFilterSearchParam(groupFilter));
    }

    const updatedFilters = updateActiveFilters(activeFilters, filterType, id, value);

    const updatedState = getUpdatedState(categories, selectedCategoryId, updatedFilters);

    setCategories(updatedState.categories);
    setSelectedCategoryId(updatedState.selectedCategoryId);
    setActiveFilters(updatedState.activeFilters);
    setFilterCounts(updatedState.filterCounts);
  };

  const onKeywordChange = (value) => {
    onFilterChange('keyword', null, value);
  };

  const onShowAllToggle = (groupName) => {
    const updatedShow = _.clone(filterGroupsShowAll);
    _.set(updatedShow, groupName, !_.get(filterGroupsShowAll, groupName, false));
    setFilterGroupsShowAll(updatedShow);
  };

  const onGroupChange = (value) => {
    updateURLParams('groupBy', value === groupByTypes.None ? `` : `${value}`);
    setGroupBy(value);
  };

  const renderTabs = (category, selected) => {
    const { id, label, subcategories, numItems } = category;
    const active = id === selected;
    const shown = id === 'all';

    const tabClasses = `text-capitalize${!numItems ? ' co-catalog-tab__empty' : ''}`;
    return (
      <VerticalTabsTab
        key={id}
        active={active}
        className={tabClasses}
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

  const renderCategoryTabs = (selected) => {
    const activeTab = _.has(categories, selected);

    return (
      <VerticalTabs restrictTabs activeTab={activeTab} shown="true">
        {_.map(categories, (category) => renderTabs(category, selected))}
      </VerticalTabs>
    );
  };

  const renderFilterGroup = (filterGroup, groupName) => {
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
              onClick={(e) => onFilterChange(groupName, filterName, e.target.checked)}
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
          return renderFilterGroup(filterGroup, groupName);
        })}
      </FilterSidePanel>
    );
  };

  const renderEmptyState = () => {
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <Title headingLevel="h2" size="lg">
          {emptyStateTitle}
        </Title>
        <EmptyStateBody>{emptyStateInfo}</EmptyStateBody>
        <EmptyStateSecondaryActions>
          <Button
            variant="link"
            onClick={() => clearFilters()}
            data-test-id="catalog-clear-filters"
          >
            {t('public~Clear All Filters')}
          </Button>
        </EmptyStateSecondaryActions>
      </EmptyState>
    );
  };

  const renderGroupedItems = (itemsGroups) => {
    const groupedItems = groupItems(itemsGroups, groupBy);
    const renderGroupHeader = (heading) => (
      <Title className="co-catalog-page__group-title" headingLevel="h2" size="lg">
        {heading} ({_.size(groupedItems[heading])})
      </Title>
    );
    return (
      <VirtualizedGrid
        items={groupedItems}
        renderCell={renderTile}
        renderHeader={renderGroupHeader}
        isItemsGrouped
      />
    );
  };

  let activeCategory = findActiveCategory(selectedCategoryId, categories);
  if (!activeCategory) {
    activeCategory = findActiveCategory('all', categories);
  }
  const numItems = t('public~{{totalItems}} items', {
    totalItems: activeCategory.numItems,
  });

  return (
    <div className="co-catalog-page co-catalog-page--with-sidebar">
      <div className="co-catalog-page__tabs">
        {renderCategoryTabs(activeCategory.id)}
        {renderSidePanel()}
      </div>
      <div className="co-catalog-page__content">
        <div className="co-catalog-page__header">
          <div className="co-catalog-page__heading text-capitalize">{activeCategory.label}</div>
          <div className="co-catalog-page__filter">
            <div>
              <SearchInput
                className="co-catalog-page__input"
                data-test="search-operatorhub"
                ref={filterByKeywordInput}
                placeholder={t('public~Filter by keyword...')}
                value={activeFilters.keyword.value}
                onChange={(event, text) => onKeywordChange(text)}
                onClear={() => onKeywordChange('')}
                aria-label={t('public~Filter by keyword...')}
              />
              {groupItems && (
                <Dropdown
                  className="co-catalog-page__btn-group__group-by"
                  menuClassName="dropdown-menu--text-wrap"
                  items={groupByTypes}
                  onChange={(e) => onGroupChange(e)}
                  titlePrefix="Group By"
                  title={groupBy}
                />
              )}
            </div>
            <div className="co-catalog-page__num-items">{numItems}</div>
          </div>
        </div>

        {activeCategory.numItems > 0 && (
          <div className="co-catalog-page__grid">
            {groupItems && groupBy !== groupByTypes.None ? (
              renderGroupedItems(activeCategory.items)
            ) : (
              <VirtualizedGrid items={activeCategory.items} renderCell={renderTile} />
            )}
          </div>
        )}
        {activeCategory.numItems === 0 && renderEmptyState()}
      </div>
    </div>
  );
};

TileViewPage.displayName = 'TileViewPage';

TileViewPage.propTypes = {
  items: PropTypes.array,
  itemsSorter: PropTypes.func.isRequired,
  getAvailableCategories: PropTypes.func.isRequired,
  getAvailableFilters: PropTypes.func,
  filterGroups: PropTypes.array.isRequired,
  filterGroupNameMap: PropTypes.object,
  renderFilterGroup: PropTypes.func,
  keywordCompare: PropTypes.func.isRequired,
  renderTile: PropTypes.func.isRequired,
  emptyStateTitle: PropTypes.string,
  emptyStateInfo: PropTypes.string,
  groupItems: PropTypes.func,
  groupByTypes: PropTypes.object,
};

TileViewPage.defaultProps = {
  items: null,
  getAvailableFilters: determineAvailableFilters,
  filterGroupNameMap: {},
  renderFilterGroup: null,
  emptyStateTitle: 'No Results Match the Filter Criteria',
  emptyStateInfo: 'No items are being shown due to the filters being applied.',
};
