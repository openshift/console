import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {FilterSidePanel, VerticalTabs} from 'patternfly-react-extensions';
import {EmptyState, FormControl} from 'patternfly-react';

import {history} from './router';

const CATEGORY_URL_PARAM = 'category';
const KEYWORD_URL_PARAM = 'keyword';

const filterSubcategories = (category, item) => {
  if (!category.subcategories) {
    if (!category.values) {
      return [];
    }

    let values = _.get(item, category.field);
    if (!Array.isArray(values)) {
      values = [values];
    }

    const intersection = [category.values, values].reduce((a, b) => a.filter(c => b.includes(c)));
    if (!_.isEmpty(intersection)) {
      return [category];
    }

    return [];
  }

  const matchedSubcategories = [];
  _.forOwn(category.subcategories, subCategory => {
    let values = _.get(item, category.field);

    if (!Array.isArray(values)) {
      values = [values];
    }

    const valuesIntersection = [subCategory.values, values].reduce((a, b) => a.filter(c => b.includes(c)));
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

const pruneCategoriesWithNoItems = categories => {
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
  _.forOwn(category.subcategories, subcategory => {
    if (subcategory.items) {
      subcategory.numItems = _.size(subcategory.items);
      subcategory.items = itemsSorter(subcategory.items);
      processSubCategories(subcategory, itemsSorter);
    }
    if (category.subcategories) {
      _.each(category.items, item => {
        const included = _.find(_.keys(category.subcategories), subcat => _.includes(category.subcategories[subcat].items, item));
        if (!included) {
          let otherCategory = _.get(category.subcategories, 'other');
          if (!otherCategory) {
            otherCategory = {id: `${category.id}-other`, label: 'Other', items: []};
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
  _.forOwn(categories, category => {
    if (category.items) {
      category.numItems = _.size(category.items);
      category.items = itemsSorter(category.items);
      processSubCategories(category, itemsSorter);
    }
  });
};

const categorize = (items, categories) => {
  // Categorize each item
  _.each(items, item => {
    let itemCategorized = false;

    _.each(categories, category => {
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
  const allCategory = {id: 'all', label: 'All Items'};
  const otherCategory = {id: 'other', label: 'Other'};

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

const clearItemsFromCategories = categories => {
  _.forOwn(categories, category => {
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
  return _.filter(items, item => compFunction(filterString, item));
};

const filterByGroup = (items, filters) => {
  // Filter items by each filter group
  return _.reduce(filters, (filtered, group, key) => {
    if (key === 'keyword') {
      return filtered;
    }

    // Only apply active filters
    const activeFilters = _.filter(group, 'active');
    if (activeFilters.length) {
      const values = _.reduce(activeFilters, (filterValues, filter) => {
        filterValues.push(filter.value, ..._.get(filter, 'synonyms', []));
        return filterValues;
      },
      []);

      filtered[key] = _.filter(items, item => {
        return values.includes(item[key]);
      });
    }

    return filtered;
  }, {});
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
  return [..._.values(filteredByGroup), filteredByKeyword].reduce((a, b) => a.filter(c => b.includes(c)));
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

  return _.some(category.subcategories, subcategory => hasActiveDescendant (activeId, subcategory));
};

const findActiveCategory = (activeId, categories) => {
  let activeCategory = null;
  _.forOwn(categories, category => {
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

  _.each(filterGroups, field => {
    _.each(items, item => {
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

const getActiveFilters = (keywordFilter, groupFilters, activeFilters) => {
  activeFilters.keyword.value = keywordFilter || '';
  activeFilters.keyword.active = !!keywordFilter;

  _.forOwn(groupFilters, (filterValues, filterType) => {
    _.each(filterValues, filterValue => {
      _.set(activeFilters, [filterType, filterValue, 'active'], true);
    });
  });

  return activeFilters;
};

export const updateActiveFilters = (activeFilters, filterType, id, value) => {

  if (filterType === 'keyword') {
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
  _.each(filterGroups, field => {
    _.each(_.keys(activeFilters[field]), key => _.set(activeFilters, [field, key, 'active'], false));
  });

  return activeFilters;
};

const getFilterGroupCounts = (items, itemsSorter, filterGroups, selectedCategoryId, filters, categories, keywordCompare) => {
  // Filter only by keyword
  const filteredItems = filterByKeyword(items, filters, keywordCompare);

  const categoriesForCounts = recategorizeItems(filteredItems, itemsSorter, [], keywordCompare, categories);

  const activeCategory = findActiveCategory(selectedCategoryId, categoriesForCounts);
  const activeItems = activeCategory ? activeCategory.items : [];
  const newFilterCounts = {};

  _.each(filterGroups, filterGroup => {
    _.each(_.keys(filters[filterGroup]), key => {
      const filterValues = [
        _.get(filters, [filterGroup, key, 'value']),
        ..._.get(filters, [filterGroup, key, 'synonyms'], []),
      ];

      const matchedItems = _.filter(activeItems, item => {
        return filterValues.includes(item[filterGroup]);
      });

      _.set(newFilterCounts, [filterGroup, key], _.size(matchedItems));
    });
  });

  return newFilterCounts;
};

const setURLParams = params => {
  const location = window.location;
  const url = new URL(location);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export const updateURLParams = (filterName, value) => {
  const params = new URLSearchParams(window.location.search);

  if (value) {
    params.set(filterName, Array.isArray(value) ? JSON.stringify(value) : value);
  } else {
    params.delete(filterName);
  }
  setURLParams(params);
};

const clearFilterURLParams = selectedCategoryId => {
  const params = new URLSearchParams();

  if (selectedCategoryId) {
    params.set(CATEGORY_URL_PARAM, selectedCategoryId);
  }

  setURLParams(params);
};

const getActiveValuesFromURL = (availableFilters, filterGroups) => {
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get(CATEGORY_URL_PARAM);
  const keywordFilter = searchParams.get(KEYWORD_URL_PARAM);

  const selectedCategoryId = categoryParam || 'all';

  const groupFilters = {};

  _.each(filterGroups, filterGroup => {
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

  const activeFilters = getActiveFilters(keywordFilter, groupFilters, availableFilters);

  return {selectedCategoryId, activeFilters};
};

export const getFilterSearchParam = groupFilter => {
  const activeValues = _.reduce(_.keys(groupFilter), (result, typeKey) => {
    return groupFilter[typeKey].active ? result.concat(typeKey) : result;
  }, []);

  return _.isEmpty(activeValues) ? '' : JSON.stringify(activeValues);
};

const defaultFilters = {
  keyword: {
    value: '',
    active: false,
  },
};

export class TileViewPage extends React.Component {
  constructor(props) {
    super(props);
    const {items, itemsSorter, getAvailableCategories} = this.props;

    const categories = getAvailableCategories(items);

    this.state = {
      categories: categorizeItems(items, itemsSorter, categories),
      selectedCategoryId: 'all',
      activeFilters: defaultFilters,
      filterCounts: null,
      filterGroupsShowAll: {},
    };

    this.onUpdateFilters = this.onUpdateFilters.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.renderFilterGroup = this.renderFilterGroup.bind(this);
    this.onShowAllToggle = this.onShowAllToggle.bind(this);
  }

  componentDidMount() {
    const {items, filterGroups, getAvailableFilters} = this.props;
    const {categories} = this.state;
    const availableFilters = getAvailableFilters(defaultFilters, items, filterGroups);

    const activeValues = getActiveValuesFromURL(availableFilters, filterGroups);

    this.setState({...this.getUpdatedState(categories, activeValues.selectedCategoryId, activeValues.activeFilters) });
    this.filterByKeywordInput.focus({preventScroll: true});
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  componentDidUpdate(prevProps) {
    const { activeFilters, selectedCategoryId } = this.state;
    const { items, itemsSorter, filterGroups, getAvailableCategories, getAvailableFilters } = this.props;

    if (!_.isEqual(items, prevProps.items)) {
      const availableFilters = getAvailableFilters(defaultFilters, items, filterGroups);
      const availableCategories = getAvailableCategories(items);
      const categories = categorizeItems(items, itemsSorter, availableCategories);

      const newActiveFilters = _.reduce(availableFilters, (updatedFilters, filterGroup, filterGroupName) => {
        if (filterGroupName === 'keyword') {
          updatedFilters.keyword = activeFilters.keyword;
          return updatedFilters;
        }

        _.each(filterGroup, (filterItem, filterItemName) => {
          updatedFilters[filterGroupName][filterItemName].active = _.get(
            activeFilters,
            [filterGroupName, filterItemName, 'active'],
            false)
          ;
        });

        return updatedFilters;
      },
      availableFilters);

      this.updateMountedState({...this.getUpdatedState(categories, selectedCategoryId, newActiveFilters)});
    }
  }

  getUpdatedState(categories, selectedCategoryId, activeFilters) {
    const { items, itemsSorter, keywordCompare, filterGroups } = this.props;

    if (!items) {
      return;
    }

    const newCategories = recategorizeItems(items, itemsSorter, activeFilters, keywordCompare, categories);

    return {
      activeFilters,
      selectedCategoryId,
      categories: newCategories,
      filterCounts: getFilterGroupCounts(items, itemsSorter, filterGroups, selectedCategoryId, activeFilters, newCategories, keywordCompare),
    };
  }

  // This function is necessary due to calls to history.replace un-mounting the component before returning
  updateMountedState(newState) {
    if (!this.unmounted) {
      this.setState(newState);
    }
  }

  clearFilters() {
    const { filterGroups } = this.props;
    const { activeFilters, categories, selectedCategoryId } = this.state;

    clearFilterURLParams(selectedCategoryId);

    const clearedFilters = clearActiveFilters(activeFilters, filterGroups);

    this.updateMountedState(this.getUpdatedState(categories, selectedCategoryId, clearedFilters));

    this.filterByKeywordInput.focus({preventScroll: true});
  }

  selectCategory(categoryId) {
    const { activeFilters, categories } = this.state;

    updateURLParams (CATEGORY_URL_PARAM, categoryId);
    this.updateMountedState(this.getUpdatedState(categories, categoryId, activeFilters));
  }

  onUpdateFilters(updatedFilters) {
    const { selectedCategoryId, categories } = this.state;
    this.updateMountedState(this.getUpdatedState(categories, selectedCategoryId, updatedFilters));
  }

  onFilterChange(filterType, id, value) {
    const { activeFilters, selectedCategoryId, categories } = this.state;

    if (filterType === 'keyword') {
      updateURLParams(KEYWORD_URL_PARAM, `${value}`);
    } else {
      const groupFilter = _.cloneDeep(activeFilters[filterType]);
      _.set(groupFilter, [id, 'active'], value);
      updateURLParams(filterType, getFilterSearchParam(groupFilter));
    }

    const updatedFilters = updateActiveFilters(activeFilters, filterType, id, value);

    this.updateMountedState(this.getUpdatedState(categories, selectedCategoryId, updatedFilters));
  }

  onKeywordChange(value) {
    this.onFilterChange('keyword', null, value);
  }

  onShowAllToggle(groupName) {
    const { filterGroupsShowAll } = this.state;
    const updatedShow = _.clone(filterGroupsShowAll);
    _.set(updatedShow, groupName, !_.get(filterGroupsShowAll, groupName, false));
    this.setState({filterGroupsShowAll: updatedShow });
  }

  renderTabs(category, selectedCategoryId) {
    const { id, label, subcategories, numItems } = category;
    const active = id === selectedCategoryId;
    const shown = id === 'all';

    const tabClasses = `text-capitalize${!numItems ? ' co-catalog-tab__empty': ''}`;
    return <VerticalTabs.Tab
      key={id}
      title={label}
      active={active}
      className={tabClasses}
      onActivate={() => this.selectCategory(id)}
      hasActiveDescendant={hasActiveDescendant(selectedCategoryId, category)}
      shown={shown}>
      {subcategories && <VerticalTabs restrictTabs activeTab={isActiveTab(selectedCategoryId, category)}>
        {_.map(subcategories, subcategory => this.renderTabs(subcategory, selectedCategoryId))}
      </VerticalTabs>}
    </VerticalTabs.Tab>;
  }

  renderCategoryTabs(selectedCategoryId) {
    const { categories } = this.state;
    const activeTab = _.has(categories, selectedCategoryId);

    return <VerticalTabs restrictTabs activeTab={activeTab} shown="true">
      {_.map(categories, category => this.renderTabs(category, selectedCategoryId))}
    </VerticalTabs>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  renderFilterGroup(filterGroup, groupName, activeFilters, filterCounts, onFilterChange, onUpdateFilters) {
    const { filterGroupNameMap } = this.props;
    const { filterGroupsShowAll } = this.state;

    return (
      <FilterSidePanel.Category
        key={groupName}
        title={filterGroupNameMap[groupName] || groupName}
        onShowAllToggle={() => this.onShowAllToggle(groupName)}
        showAll={_.get(filterGroupsShowAll, groupName, false)}
        data-test-group-name={groupName}
      >
        {_.map(filterGroup, (filter, filterName) => {
          const { label, active } = filter;
          return <FilterSidePanel.CategoryItem
            key={filterName}
            count={_.get(filterCounts, [groupName, filterName], 0)}
            checked={active}
            onChange={e => onFilterChange(groupName, filterName, e.target.checked)}
            title={label}
            data-test={`${groupName}-${_.kebabCase(filterName)}`}
          >
            {label}
          </FilterSidePanel.CategoryItem>;
        })}
      </FilterSidePanel.Category>
    );
  }

  renderSidePanel() {
    let { renderFilterGroup } = this.props;
    const { activeFilters, filterCounts } = this.state;

    renderFilterGroup = renderFilterGroup || this.renderFilterGroup;

    return (
      <FilterSidePanel>
        {_.map(activeFilters, (filterGroup, groupName) => {
          if (groupName === 'keyword') {
            return;
          }
          return renderFilterGroup(filterGroup, groupName, activeFilters, filterCounts, this.onFilterChange, this.onUpdateFilters);
        })}
      </FilterSidePanel>
    );
  }

  renderEmptyState() {
    const { emptyStateTitle, emptyStateInfo } = this.props;
    return (
      <EmptyState className="co-catalog-page__no-filter-results">
        <EmptyState.Title className="co-catalog-page__no-filter-results-title" aria-level="2">
          {emptyStateTitle}
        </EmptyState.Title>
        <EmptyState.Info className="text-secondary">
          {emptyStateInfo}
        </EmptyState.Info>
        <EmptyState.Help>
          <button type="button" className="btn btn-link" onClick={() => this.clearFilters()}>Clear All Filters</button>
        </EmptyState.Help>
      </EmptyState>
    );
  }

  render() {
    const { renderTile } = this.props;
    const { activeFilters, selectedCategoryId, categories } = this.state;
    let activeCategory = findActiveCategory(selectedCategoryId, categories);
    if (!activeCategory) {
      activeCategory = findActiveCategory('all', categories);
    }

    return (
      <div className="co-catalog-page">
        <div className="co-catalog-page__tabs">
          { this.renderCategoryTabs(activeCategory.id) }
          { this.renderSidePanel() }
        </div>
        <div className="co-catalog-page__content">
          <div className="co-catalog-page__header">
            <div className="co-catalog-page__heading text-capitalize">{activeCategory.label}</div>
            <div className="co-catalog-page__filter">
              <FormControl
                className="co-catalog-page__input"
                type="text"
                inputRef={(ref) => this.filterByKeywordInput = ref}
                placeholder="Filter by keyword..."
                bsClass="form-control"
                value={activeFilters.keyword.value}
                onChange={e => this.onKeywordChange(e.target.value)}
              />
              <div className="co-catalog-page__num-items">{activeCategory.numItems} items</div>
            </div>
          </div>
          {activeCategory.numItems > 0 && (
            <div className="catalog-tile-view-pf catalog-tile-view-pf-no-categories">
              {_.map(activeCategory.items, item => renderTile(item))}
            </div>
          )}
          {activeCategory.numItems === 0 && this.renderEmptyState()}
        </div>
      </div>
    );
  }
}

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
};

TileViewPage.defaultProps = {
  items: null,
  getAvailableFilters: determineAvailableFilters,
  filterGroupNameMap: {},
  renderFilterGroup: null,
  emptyStateTitle: 'No Results Match the Filter Criteria',
  emptyStateInfo: 'No items are being shown due to the filters being applied.',
};
