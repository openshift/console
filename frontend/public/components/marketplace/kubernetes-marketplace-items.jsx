import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {CatalogTileView} from 'patternfly-react-extensions/dist/esm/components/CatalogTileView';
import {CatalogTile} from 'patternfly-react-extensions/dist/esm/components/CatalogTile';
import {FilterSidePanel} from 'patternfly-react-extensions/dist/esm/components/FilterSidePanel';
import VerticalTabs from 'patternfly-react-extensions/dist/esm/components/VerticalTabs/VerticalTabs';
import {EmptyState} from 'patternfly-react/dist/esm/components/EmptyState';
import FormControl from 'patternfly-react/dist/esm/components/Form/FormControl';

import {normalizeIconClass} from '../catalog/catalog-item-icon';
import {CategoryFilterUtils} from '../utils/category-filter-utils';
import {history} from '../utils';

const marketplaceCategories = [
  {
    id: 'featured',
    label: 'Featured',
    field: 'keywords',
    values: ['featured']
  },
  {
    id: 'databases',
    label: 'Databases',
    field: 'keywords',
    values: ['database']
  },
  {
    id: 'storage',
    label: 'Storage',
    field: 'keywords',
    values: ['storage']
  },
  {
    id: 'networking',
    label: 'Networking',
    field: 'keywords',
    values: ['networking']
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    field: 'keywords',
    values: ['monitoring']
  },
  {
    id: 'messaging',
    label: 'Messaging',
    field: 'keywords',
    values: ['messaging']
  },
  {
    id: 'dev-tools',
    label: 'Developer Tools',
    field: 'keywords',
    values: ['dev-tool']
  },
  {
    id: 'identity',
    label: 'Identity',
    field: 'keywords',
    values: ['identity']
  },
  {
    id: 'security',
    label: 'Security',
    field: 'keywords',
    values: ['security']
  },
  {
    id: 'catalog',
    label: 'Catalog',
    field: 'keywords',
    values: ['catalog']
  },
  {
    id: 'blog-cm',
    label: 'Blog & CMS',
    field: 'keywords',
    values: ['blog', ['cms']]
  },
];

// Filter property white list
const filterGroups = [
  'provider',
];

const defaultFilters = {
  keyword: {
    value: '',
    active: false,
  },
};

const defaultFilterCounts = {
  provider: {},
};

export class MarketplaceTileViewPage extends React.Component {
  constructor(props) {
    super(props);
    const {items} = this.props;

    // Filters are populated based on white list of item properties
    const availableFilters = CategoryFilterUtils.getAvailableFilters(defaultFilters, items, filterGroups);

    this.state = {
      categories: CategoryFilterUtils.categorizeItems(items, marketplaceCategories),
      currentCategories: null,
      activeTabId: 'all',
      availableFilters,
      activeFilters: availableFilters,
      filterCounts: defaultFilterCounts
    };
  }

  componentDidMount() {
    this.setState(this.getUpdatedStateFromURL(window.location.search));
  }

  componentDidUpdate(prevProps) {
    const { activeFilters, activeTabId } = this.state;
    const { items } = this.props;

    if (items !== prevProps.items) {
      const availableFilters = CategoryFilterUtils.getAvailableFilters(defaultFilters, items, filterGroups);
      const categories = CategoryFilterUtils.categorizeItems(items, marketplaceCategories);
      this.setState({availableFilters, ...this.getUpdatedState(categories, activeTabId, activeFilters)});
    }
  }

  getUpdatedState (categories, activeTabId, activeFilters) {
    const { items } = this.props;
    const { filterCounts } = this.state || {};

    if (!items) {
      return;
    }

    const updateFilterCounts = filterCounts || {};

    // Filter items by keyword first
    const filteredByKeyword = this.filterByKeyword(items, activeFilters);

    // Apply each filter property individually. Example:
    //  filteredByGroup = {
    //    provider: [/*array of items filtered by provider*/],
    //    healthIndex: [/*array of items filtered by healthIndex*/],
    //  };
    const filteredByGroup = this.filterByGroup(filteredByKeyword, activeFilters);

    // Intersection of individually applied filters is all filters
    // In the case no filters are active, returns items filteredByKeyword
    const filteredItems = _.intersection(..._.values(filteredByGroup), filteredByKeyword);

    const newCategories = CategoryFilterUtils.recategorizeItems(filteredItems, categories);

    return {
      activeFilters,
      activeTabId,
      categories: newCategories,
      currentCategories: MarketplaceTileViewPage.getCurrentCategories(activeTabId, newCategories),
      filterCounts: this.getFilterCounts(activeTabId, activeFilters, updateFilterCounts, newCategories)
    };
  }

  getUpdatedStateFromURL(searchURL) {
    const {categories, availableFilters} = this.state;
    const activeValues = CategoryFilterUtils.getActiveValuesFromURL(availableFilters, filterGroups, searchURL);

    return this.getUpdatedState(categories, activeValues.activeTabId, activeValues.activeFilters);
  }

  getFilterCounts(activeTabId, filters, filterCounts, categories) {
    const { items } = this.props;

    const filteredItems = this.filterByKeyword(items, filters);
    return CategoryFilterUtils.getFilterGroupCounts(filteredItems, filterGroups, activeTabId, filters, categories);
  }

  filterByGroup(items, filters) {
    // Filter items by each filter group
    return _.reduce(filters, (filtered, group, key) => {
      if (key === 'keyword') {
        return filtered;
      }

      // Only apply active filters
      const activeFilters = _.filter(group, 'active');
      if (activeFilters.length) {
        const values = _.map(activeFilters, 'value');
        filtered[key] = _.filter(items, item => values.includes(item[key]));
      }

      return filtered;
    }, {});
  }

  filterByKeyword(items, filters) {
    const { keyword } = filters;
    if (keyword.active) {
      const filterString = keyword.value.toLowerCase();
      return _.filter(items, item => item.name.toLowerCase().includes(filterString) ||
        (item.description && item.description.toLowerCase().includes(filterString)) ||
        (item.tags && item.tags.includes(filterString)));
    }
    return items;
  }

  static getCurrentCategories(activeTabId, categories) {
    const selectedCategory = CategoryFilterUtils.findActiveCategory(activeTabId, categories);
    return (selectedCategory && selectedCategory.subcategories) || categories;
  }

  clearFilters() {
    const params = new URLSearchParams(window.location.search);

    params.delete('keyword');

    _.forEach(filterGroups, filterGroup => {
      params.delete(filterGroup);
    });

    const url = new URL(window.location);
    const searchParams = `?${params.toString()}${url.hash}`;

    history.replace(`${url.pathname}${searchParams}`);
    this.setState(this.getUpdatedStateFromURL(searchParams));

    this.filterByKeywordInput.focus();
  }

  updateURL (filterName, value) {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(filterName, value);
    } else {
      params.delete(filterName);
    }
    const url = new URL(window.location);
    const searchParams = `?${params.toString()}${url.hash}`;

    history.replace(`${url.pathname}${searchParams}`);
    this.setState(this.getUpdatedStateFromURL(searchParams));
  }

  selectCategory(categoryId) {
    this.updateURL (CategoryFilterUtils.CATEGORY_URL_PARAM, categoryId);
  }

  onFilterChange(filterType, id, value) {
    const { activeFilters } = this.state;

    if (filterType === 'keyword') {
      this.updateURL(CategoryFilterUtils.KEYWORD_URL_PARAM, `${value}`);
    } else {
      const groupFilter = activeFilters[filterType];
      _.set(groupFilter, [id, 'active'], value);
      this.updateURL(filterType, CategoryFilterUtils.getFilterSearchParam(groupFilter));
    }
  }

  getCategoryLabel(categoryID) {
    const { categories } = this.state;
    if (!categoryID || !categories) {
      return '';
    }

    return _.find(categories, { id: categoryID }).label;
  }

  renderTabs(category, activeTabId) {
    const { id, label, subcategories } = category;
    const active = id === activeTabId;
    const shown = id === 'all';

    return <VerticalTabs.Tab
      key={id}
      title={label}
      active={active}
      className={!category.numItems ? 'co-catalog-tab__empty' : null}
      onActivate={() => this.selectCategory(id)}
      hasActiveDescendant={CategoryFilterUtils.hasActiveDescendant(activeTabId, category)}
      shown={shown}>
      {!_.isEmpty(subcategories) && <VerticalTabs restrictTabs activeTab={CategoryFilterUtils.isActiveTab(activeTabId, category)}>
        {_.map(subcategories, subcategory => this.renderTabs(subcategory, activeTabId))}
      </VerticalTabs>}
    </VerticalTabs.Tab>;
  }

  renderCategoryTabs(activeTabId) {
    const { categories } = this.state;
    const activeTab = !!_.find(categories, {id: activeTabId});

    return <VerticalTabs restrictTabs activeTab={activeTab} shown="true">
      {_.map(categories, (category) => this.renderTabs(category, activeTabId))}
    </VerticalTabs>;
  }


  renderCategory(category, viewAll) {
    const { openOverlay } = this.props;

    if (!_.size(category.items)) {
      return null;
    }

    return (
      <CatalogTileView.Category
        key={category.id}
        title={category.label}
        totalItems={_.size(category.items)}
        viewAll={viewAll}
        onViewAll={() => this.selectCategory(category.id)}>
        {_.map(category.items, item => {
          const { uid, name, imgUrl, iconClass, provider, description } = item;
          const normalizedIconClass = iconClass && `icon ${normalizeIconClass(iconClass)}`;
          const vendor = provider ? `Provided by ${provider}` : null;
          return <CatalogTile
            id={uid}
            key={uid}
            title={name}
            iconImg={imgUrl}
            iconClass={normalizedIconClass}
            vendor={vendor}
            description={description}
            onClick={() => openOverlay(item)}
          />;
        })}
      </CatalogTileView.Category>
    );
  }

  renderCategoryTiles(category, topLevel = true) {
    const { currentCategories, activeTabId } = this.state;
    const { subcategories } = category;

    if (activeTabId === 'all') {
      return (
        <React.Fragment>
          {_.map(currentCategories, topCategory => {
            if (topCategory.id === 'all') {
              return null;
            }
            return this.renderCategory(topCategory, false);
          })}
        </React.Fragment>
      );
    }
    if (topLevel && !_.size(subcategories)) {
      return this.renderCategory(category, true);
    }

    return (
      <React.Fragment>
        {_.map(subcategories, subcategory => this.renderCategory(subcategory, false))}
      </React.Fragment>
    );
  }

  render() {
    const { activeTabId, categories, currentCategories, activeFilters, filterCounts } = this.state;
    let activeCategory = CategoryFilterUtils.findActiveCategory(activeTabId, categories);
    if (!activeCategory) {
      activeCategory = CategoryFilterUtils.findActiveCategory('all', categories);
    }

    const heading = activeCategory ? activeCategory.label : this.getCategoryLabel('all');
    const numItems = activeCategory ? activeCategory.numItems : 0;

    return (
      <div className="co-catalog-page">
        <div className="co-catalog-page__tabs">
          { this.renderCategoryTabs(activeCategory.id) }
          <FilterSidePanel>
            <FilterSidePanel.Category key="keyword" onSubmit={(e) => e.preventDefault()}>
              <FormControl
                type="text"
                inputRef={(ref) => this.filterByKeywordInput = ref}
                placeholder="Filter by keyword..."
                bsClass="form-control"
                value={activeFilters.keyword.value}
                onChange={e => this.onFilterChange('keyword', null, e.target.value)}
              />
            </FilterSidePanel.Category>
            {_.map(activeFilters, (filterGroup, groupName) => {
              if (groupName === 'keyword') {
                return;
              }
              return <FilterSidePanel.Category
                key={groupName}
                title={groupName}
              >
                {_.map(filterGroup, (filter, filterName) => {
                  const { label, active } = filter;
                  return <FilterSidePanel.CategoryItem
                    key={filterName}
                    count={_.get(filterCounts, [groupName, filterName], 0)}
                    checked={active}
                    onChange={e => this.onFilterChange(groupName, filterName, e.target.checked)}
                  >
                    {label}
                  </FilterSidePanel.CategoryItem>;
                })}
              </FilterSidePanel.Category>;
            })}
          </FilterSidePanel>
        </div>
        <div className="co-catalog-page__content">
          <div>
            <div className="co-catalog-page__heading">{heading}</div>
            <div className="co-catalog-page__num-items">{numItems} items</div>
          </div>
          {numItems > 0 && <CatalogTileView>
            {activeCategory
              ? this.renderCategoryTiles(activeCategory)
              : _.map(currentCategories, category => (category.numItems && category.id !== 'all') ? this.renderCategoryTiles(category) : null)}
          </CatalogTileView>}
          {numItems === 0 && <EmptyState className="co-catalog-page__no-filter-results">
            <EmptyState.Title className="co-catalog-page__no-filter-results-title" aria-level="2">
              No Results Match the Filter Criteria
            </EmptyState.Title>
            <EmptyState.Info className="text-secondary">
               No marketplace items are being shown due to the filters being applied.
            </EmptyState.Info>
            <EmptyState.Help>
              <button type="button" className="btn btn-link" onClick={() => this.clearFilters()}>Clear All Filters</button>
            </EmptyState.Help>
          </EmptyState>}
        </div>
      </div>
    );
  }
}

MarketplaceTileViewPage.displayName = 'MarketplaceTileViewPage';
MarketplaceTileViewPage.propTypes = {
  items: PropTypes.array,
};
