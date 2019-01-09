/* eslint-disable no-undef */
import * as React from 'react';
import * as _ from 'lodash-es';
import {FilterSidePanel, VerticalTabs} from 'patternfly-react-extensions';
import {EmptyState, FormControl} from 'patternfly-react';

import {history} from './router';

const CATEGORY_URL_PARAM = 'category';
const KEYWORD_URL_PARAM = 'keyword';

export class TileViewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      categories: {},
      selectedCategoryId: 'all',
      activeFilters: this.getDefaultFilters(),
      filterCounts: null,
    };
  }

  componentDidMount() {
    const {items} = this.props;
    const availableFilters = this.getAvailableFilters(this.getDefaultFilters(), items);
    const categories = this.categorizeItems(items, this.getAvailableCategories(items));

    const activeValues = this.getActiveValuesFromURL(availableFilters);

    this.setState({items, ...this.getUpdatedState(items, categories, activeValues.selectedCategoryId, activeValues.activeFilters) });
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  componentDidUpdate(prevProps, prevState) {
    const { activeFilters, selectedCategoryId } = this.state;
    const { items } = this.state;

    if (!_.isEqual(items, prevState.items)) {
      const availableFilters = this.getAvailableFilters(this.getDefaultFilters(), items);
      const marketplaceCategories = this.getAvailableCategories(items);
      const categories = this.categorizeItems(items, marketplaceCategories);

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

      this.updateMountedState({...this.getUpdatedState(items, categories, selectedCategoryId, newActiveFilters)});
    }
  }

  filterSubcategories = (category, item) => {
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
        matchedSubcategories.push(subCategory, ...this.filterSubcategories(subCategory, item));
      }
    });

    return matchedSubcategories;
  };

  // categorize item under sub and main categories
  addItem = (item, category, subcategory = null) => {
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

  isCategoryEmpty = ({ items }) => _.isEmpty(items);

  pruneCategoriesWithNoItems = categories => {
    if (!categories) {
      return;
    }

    _.forOwn(categories, (category, key) => {
      if (this.isCategoryEmpty(category)) {
        delete categories[key];
      } else {
        this.pruneCategoriesWithNoItems(category.subcategories);
      }
    });
  };

  processSubCategories = (category) => {
    _.forOwn(category.subcategories, subcategory => {
      if (subcategory.items) {
        subcategory.numItems = _.size(subcategory.items);
        subcategory.items = this.itemsSorter(subcategory.items);
        this.processSubCategories(subcategory, this.itemsSorter);
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
  processCategories = (categories) => {
    _.forOwn(categories, category => {
      if (category.items) {
        category.numItems = _.size(category.items);
        category.items = this.itemsSorter(category.items);
        this.processSubCategories(category);
      }
    });
  };

  categorize = (items, categories) => {
    // Categorize each item
    _.each(items, item => {
      let itemCategorized = false;

      _.each(categories, category => {
        const matchedSubcategories = this.filterSubcategories(category, item);
        _.each(matchedSubcategories, (subcategory) => {
          this.addItem(item, category, subcategory); // add to subcategory & main category
          itemCategorized = true;
        });
      });
      if (!itemCategorized) {
        this.addItem(item, categories.other); // add to Other category
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
  categorizeItems = (items, initCategories) => {
    const allCategory = {id: 'all', label: 'All Items'};
    const otherCategory = {id: 'other', label: 'Other'};

    const categories = {
      all: allCategory,
      ..._.cloneDeep(initCategories),
      other: otherCategory,
    };

    this.categorize(items, categories);
    this.pruneCategoriesWithNoItems(categories);
    this.processCategories(categories);

    return categories;
  };

  clearItemsFromCategories = categories => {
    _.forOwn(categories, category => {
      category.numItems = 0;
      category.items = [];
      this.clearItemsFromCategories(category.subcategories);
    });
  };

  keywordCompare = (filterString, item) => {
    if (!filterString) {
      return true;
    }
    if (!item) {
      return false;
    }

    return _.get(item, 'name', '').toLowerCase().includes(filterString);
  };

  filterByKeyword = (items, filters) => {
    const { keyword } = filters;
    if (!keyword || !keyword.active) {
      return items;
    }

    const filterString = keyword.value.toLowerCase();
    return _.filter(items, item => this.keywordCompare(filterString, item));
  };

  filterByGroup = (items, filters) => {
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

  filterItems = (items, filters) => {
    if (_.isEmpty(filters)) {
      return items;
    }

    // Filter items by keyword first
    const filteredByKeyword = this.filterByKeyword(items, filters);

    // Apply each filter property individually. Example:
    //  filteredByGroup = {
    //    provider: [/*array of items filtered by provider*/],
    //    healthIndex: [/*array of items filtered by healthIndex*/],
    //  };
    const filteredByGroup = this.filterByGroup(filteredByKeyword, filters);

    // Intersection of individually applied filters is all filters
    // In the case no filters are active, returns items filteredByKeyword
    return [..._.values(filteredByGroup), filteredByKeyword].reduce((a, b) => a.filter(c => b.includes(c)));
  };

  recategorizeItems = (items, filters, categories) => {
    const filteredItems = this.filterItems(items, filters);

    const newCategories = _.cloneDeep(categories);
    this.clearItemsFromCategories(newCategories);

    this.categorize(filteredItems, newCategories);
    this.processCategories(newCategories);

    return newCategories;
  };

  isActiveTab = (activeId, category) => {
    return _.has(category.subcategories, activeId);
  };

  hasActiveDescendant = (activeId, category) => {
    if (_.has(category.subcategories, activeId)) {
      return true;
    }

    return _.some(category.subcategories, subcategory => this.hasActiveDescendant (activeId, subcategory));
  };

  findActiveCategory = (activeId, categories) => {
    let activeCategory = null;
    _.forOwn(categories, category => {
      if (activeCategory) {
        return;
      }

      if (category.id === activeId) {
        activeCategory = category;
      } else {
        activeCategory = this.findActiveCategory(activeId, category.subcategories);
      }
    });
    return activeCategory;
  };

  getAvailableFilters = (initialFilters, items) => {
    const filters = _.cloneDeep(initialFilters);

    _.each(this.filterGroups, field => {
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

  getActiveFilters = (keywordFilter, groupFilters, activeFilters) => {
    activeFilters.keyword.value = keywordFilter || '';
    activeFilters.keyword.active = !!keywordFilter;

    _.forOwn(groupFilters, (filterValues, filterType) => {
      _.each(filterValues, filterValue => {
        _.set(activeFilters, [filterType, filterValue, 'active'], true);
      });
    });

    return activeFilters;
  };

  updateActiveFilters = (activeFilters, filterType, id, value) => {
    if (filterType === 'keyword') {
      _.set(activeFilters, 'keyword.value', value);
      _.set(activeFilters, 'keyword.active', !!value);
    } else {
      _.set(activeFilters, [filterType, id, 'active'], value);
    }

    return activeFilters;
  };

  clearActiveFilters = (activeFilters) => {
    // Clear the keyword filter
    _.set(activeFilters, 'keyword.value', '');
    _.set(activeFilters, 'keyword.active', false);

    // Clear the group filters
    _.each(this.filterGroups, field => {
      _.each(_.keys(activeFilters[field]), key => _.set(activeFilters, [field, key, 'active'], false));
    });

    return activeFilters;
  };

  getFilterGroupCounts = (items, selectedCategoryId, filters, categories) => {
    // Filter only by keyword
    const filteredItems = this.filterByKeyword(items, filters);

    const categoriesForCounts = this.recategorizeItems(filteredItems, [], categories);

    const activeCategory = this.findActiveCategory(selectedCategoryId, categoriesForCounts);
    const activeItems = activeCategory ? activeCategory.items : [];
    const newFilterCounts = {};

    _.each(this.filterGroups, filterGroup => {
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

  setURLParams = params => {
    const location = window.location;
    const url = new URL(location);
    const searchParams = `?${params.toString()}${url.hash}`;

    history.replace(`${url.pathname}${searchParams}`);
  };

  updateURLParams = (filterName, value) => {
    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set(filterName, Array.isArray(value) ? JSON.stringify(value) : value);
    } else {
      params.delete(filterName);
    }
    this.setURLParams(params);
  };

  clearFilterURLParams = selectedCategoryId => {
    const params = new URLSearchParams();

    if (selectedCategoryId) {
      params.set(CATEGORY_URL_PARAM, selectedCategoryId);
    }

    this.setURLParams(params);
  };

  getActiveValuesFromURL = (availableFilters) => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = searchParams.get(CATEGORY_URL_PARAM);
    const keywordFilter = searchParams.get(KEYWORD_URL_PARAM);

    const selectedCategoryId = categoryParam || 'all';

    const groupFilters = {};

    _.each(this.filterGroups, filterGroup => {
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

    const activeFilters = this.getActiveFilters(keywordFilter, groupFilters, availableFilters);

    return {selectedCategoryId, activeFilters};
  };

  getFilterSearchParam = groupFilter => {
    const activeValues = _.reduce(_.keys(groupFilter), (result, typeKey) => {
      return groupFilter[typeKey].active ? result.concat(typeKey) : result;
    }, []);

    return _.isEmpty(activeValues) ? '' : JSON.stringify(activeValues);
  };

  getDefaultFilters = () => {
    return {
      keyword: {
        value: '',
        active: false,
      },
    };
  };

  filterGroups = [];
  filterGroupNameMap = {};

  emptyStateTitle = 'No Results Match the Filter Criteria';
  emptyStateInfo = 'No items are being shown due to the filters being applied.';

  // eslint-disable-next-line no-unused-vars
  getAvailableCategories = (items) => {
    return {};
  };

  itemsSorter = (itemsToSort) => {
    return itemsToSort;
  };


  getUpdatedState(items, categories, selectedCategoryId, activeFilters) {
    if (!items) {
      return;
    }

    const newCategories = this.recategorizeItems(items, activeFilters, categories);

    return {
      activeFilters,
      selectedCategoryId,
      categories: newCategories,
      filterCounts: this.getFilterGroupCounts(items, selectedCategoryId, activeFilters, newCategories),
    };
  }

  // This function is necessary due to calls to history.replace un-mounting the component before returning
  updateMountedState(newState) {
    if (!this.unmounted) {
      this.setState(newState);
    }
  }

  clearFilters() {
    const { items, activeFilters, categories, selectedCategoryId } = this.state;

    this.clearFilterURLParams(selectedCategoryId);

    const clearedFilters = this.clearActiveFilters(activeFilters);

    this.updateMountedState(this.getUpdatedState(items, categories, selectedCategoryId, clearedFilters));

    this.filterByKeywordInput.focus();
  }

  selectCategory(categoryId) {
    const { items, activeFilters, categories } = this.state;

    this.updateURLParams (CATEGORY_URL_PARAM, categoryId);
    this.updateMountedState(this.getUpdatedState(items, categories, categoryId, activeFilters));
  }

  onFilterChange(filterType, id, value) {
    const { items, activeFilters, selectedCategoryId, categories } = this.state;

    if (filterType === 'keyword') {
      this.updateURLParams(KEYWORD_URL_PARAM, `${value}`);
    } else {
      const groupFilter = _.cloneDeep(activeFilters[filterType]);
      _.set(groupFilter, [id, 'active'], value);
      this.updateURLParams(filterType, this.getFilterSearchParam(groupFilter));
    }

    const updatedFilters = this.updateActiveFilters(activeFilters, filterType, id, value);

    this.updateMountedState(this.getUpdatedState(items, categories, selectedCategoryId, updatedFilters));
  }

  onKeywordChange(value) {
    this.onFilterChange('keyword', null, value);
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
      hasActiveDescendant={this.hasActiveDescendant(selectedCategoryId, category)}
      shown={shown}>
      {subcategories && <VerticalTabs restrictTabs activeTab={this.isActiveTab(selectedCategoryId, category)}>
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

  renderKeywordFilter = (keywordFilter) => {
    if (!keywordFilter) {
      return null;
    }

    return (
      <FilterSidePanel.Category key="keyword" onSubmit={(e) => e.preventDefault()}>
        <FormControl
          type="text"
          inputRef={(ref) => this.filterByKeywordInput = ref}
          autoFocus={true}
          placeholder="Filter by keyword..."
          bsClass="form-control"
          value={keywordFilter.value}
          onChange={e => this.onKeywordChange(e.target.value)}
        />
      </FilterSidePanel.Category>
    );
  };

  renderFilterItem = (filter, filterName, groupName) => {
    const { filterCounts } = this.state;
    const { label, active } = filter;
    return <FilterSidePanel.CategoryItem
      key={filterName}
      count={_.get(filterCounts, [groupName, filterName], 0)}
      checked={active}
      onChange={e => this.onFilterChange(groupName, filterName, e.target.checked)}
      title={label}
    >
      {label}
    </FilterSidePanel.CategoryItem>;
  };

  renderFilterGroup = (filterGroup, groupName) => (
    <FilterSidePanel.Category
      key={groupName}
      title={this.filterGroupNameMap[groupName] || groupName}
    >
      {_.map(filterGroup, (filter, filterName) => {
        return this.renderFilterItem(filter, filterName, groupName);
      })}
    </FilterSidePanel.Category>
  );

  renderSidePanel() {
    const { activeFilters } = this.state;

    return (
      <FilterSidePanel>
        {this.renderKeywordFilter(activeFilters.keyword)}
        {_.map(activeFilters, (filterGroup, groupName) => {
          if (groupName === 'keyword') {
            return;
          }
          return this.renderFilterGroup(filterGroup, groupName);
        })}
      </FilterSidePanel>
    );
  }

  renderEmptyState() {
    return (
      <EmptyState className="co-catalog-page__no-filter-results">
        <EmptyState.Title className="co-catalog-page__no-filter-results-title" aria-level="2">
          {this.emptyStateTitle}
        </EmptyState.Title>
        <EmptyState.Info className="text-secondary">
          {this.emptyStateInfo}
        </EmptyState.Info>
        <EmptyState.Help>
          <button type="button" className="btn btn-link" onClick={() => this.clearFilters()}>Clear All Filters</button>
        </EmptyState.Help>
      </EmptyState>
    );
  }

  renderPageItems() {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  renderTile = (item) => {
    return null;
  };

  render() {
    const { selectedCategoryId, categories } = this.state;
    let activeCategory = this.findActiveCategory(selectedCategoryId, categories);
    if (!activeCategory) {
      activeCategory = this.findActiveCategory('all', categories);
    }

    if (!activeCategory) {
      return null;
    }

    return (
      <React.Fragment>
        {this.pageDescription && (
          <p className="co-catalog-page__description">
            {this.pageDescription}
          </p>
        )}
        <div className="co-catalog-page">
          <div className="co-catalog-page__tabs">
            { this.renderCategoryTabs(activeCategory.id) }
            { this.renderSidePanel() }
          </div>
          <div className="co-catalog-page__content">
            <div>
              <div className="co-catalog-page__heading text-capitalize">{activeCategory.label}</div>
              <div className="co-catalog-page__num-items">{activeCategory.numItems} items</div>
            </div>
            {activeCategory.numItems > 0 && (
              <div className="catalog-tile-view-pf catalog-tile-view-pf-no-categories">
                {_.map(activeCategory.items, item => this.renderTile(item))}
              </div>
            )}
            {activeCategory.numItems === 0 && this.renderEmptyState()}
          </div>
          {this.renderPageItems()}
        </div>
      </React.Fragment>
    );
  }
}

TileViewPage.displayName = 'TileViewPage';
