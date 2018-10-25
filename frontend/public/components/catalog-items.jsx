import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {CatalogTileView} from 'patternfly-react-extensions/dist/esm/components/CatalogTileView';
import {CatalogTile} from 'patternfly-react-extensions/dist/esm/components/CatalogTile';
import {VerticalTabs} from 'patternfly-react-extensions/dist/esm/components/VerticalTabs';
import {FilterSidePanel} from 'patternfly-react-extensions/dist/esm/components/FilterSidePanel';
import {EmptyState} from 'patternfly-react/dist/esm/components/EmptyState';
import FormControl from 'patternfly-react/dist/esm/components/Form/FormControl';

import {normalizeIconClass} from './catalog-item-icon';
import {categorizeItems, recategorizeItems} from './utils/categorize-catalog-items';
import {history} from './utils';

export class CatalogTileViewPage extends React.Component {
  constructor(props) {
    super(props);

    const categories = categorizeItems(props.items);
    const activeTabs = ['all']; // array of tabs [main category, sub-category]
    const filters = {
      byKeyword: {
        value: '',
        active: false,
      },
      byType: {
        clusterServiceClass: {
          label: 'Service Class',
          value: 'ClusterServiceClass',
          active: false,
        },
        imageStream: {
          label: 'Source-to-Image',
          value: 'ImageStream',
          active: false,
        },
      }
    };

    let filterCounts = {
      byType: {
        clusterServiceClasses: 0,
        imageStreams: 0,
      },
    };

    this.state = this.getCategoryState(activeTabs, categories);
    filterCounts = this.getFilterCounts(activeTabs, filters, filterCounts, categories);

    _.assign(this.state, {
      showAllItemsForCategory: null,
      activeTabs,
      filters,
      filterCounts,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { filters, filterCounts, activeTabs, categories } = this.state;
    const { items } = this.props;

    if (items !== prevProps.items) {
      const newCategories = categorizeItems(items);
      this.setState(this.getCategoryState(activeTabs, newCategories));
      if (this.hasActiveFilters(filters)) {
        const filteredItems = this.filterItems(items);
        const filteredCategories = recategorizeItems(filteredItems, newCategories);
        this.setState(this.getCategoryState(activeTabs, filteredCategories));
      }
      this.setState(this.getFilterCounts(activeTabs, filters, filterCounts, newCategories));
    }

    if (filters !== prevState.filters) {
      const filteredItems = this.filterItems(items);
      const newCategories = recategorizeItems(filteredItems, categories);
      this.setState(this.getCategoryState(activeTabs, newCategories));
    }

    if (activeTabs !== prevState.activeTabs) {
      this.setState(this.getCategoryState(activeTabs, categories));
    }

    // filter counts are updated when new Category tab is selected or filter by name changed
    if (activeTabs !== prevState.activeTabs || prevState.filters.byKeyword !== filters.byKeyword ) {
      this.setState(this.getFilterCounts(activeTabs, filters, filterCounts, categories));
    }
  }

  hasActiveFilters(filters) {
    const { byKeyword, byType } = filters;
    return byType.clusterServiceClass.active || byType.imageStream.active || byKeyword.active;
  }

  getActiveCategories(activeTabs, categories) {
    const mainCategory = _.find(categories, { id: _.first(activeTabs) });
    const subCategory = activeTabs.length < 2 ? null : _.find(mainCategory.subcategories, { id: _.last(activeTabs) });
    return [mainCategory, subCategory];
  }

  getFilterCounts(activeTabs, filters, filterCounts, categories) {
    const filteredItems = this.filterItemsForCounts(filters);
    const categoriesForCounts = recategorizeItems(filteredItems, categories);

    const [ mainCategory, subCategory ] = this.getActiveCategories(activeTabs, categoriesForCounts);
    const items = subCategory ? subCategory.items : mainCategory.items;

    const count = _.countBy(items, 'kind');
    const newFilterCounts = {...filterCounts};
    newFilterCounts.byType.clusterServiceClasses = count.ClusterServiceClass || 0;
    newFilterCounts.byType.imageStreams = count.ImageStream || 0;

    return newFilterCounts;
  }

  getCategoryState(activeTabs, categories) {
    const [ mainCategory, subCategory ] = this.getActiveCategories(activeTabs, categories);
    const currentCategories = mainCategory.subcategories || categories;
    const numItems = subCategory ? subCategory.numItems : mainCategory.numItems;

    return {
      categories,
      currentCategories,
      numItems: numItems || 0,
    };
  }

  isAllTabActive() {
    const { activeTabs } = this.state;
    return _.first(activeTabs) === 'all';
  }

  activeTabIsSubCategory(subcategories) {
    const { activeTabs } = this.state;
    if (activeTabs.length < 2) {
      return false;
    }

    const activeID = _.last(activeTabs);
    return _.some(subcategories, { id: activeID });
  }

  isActiveTab(categoryID) {
    const { activeTabs } = this.state;
    const activeID = _.last(activeTabs);
    return activeID === categoryID;
  }

  hasActiveDescendant(categoryID) {
    const { activeTabs } = this.state;
    return _.first(activeTabs) === categoryID;
  }

  renderTabs(category, parentID = null){
    const { id, label, subcategories } = category;
    const active = this.isActiveTab(id);
    const onActivate = () => {
      const tabs = parentID ? [parentID, id] : [id];
      this.onActivateTab(tabs);
    };
    const hasActiveDescendant = this.hasActiveDescendant(id);
    const shown = id === 'all';
    return <VerticalTabs.Tab
      key={id}
      title={label}
      active={active}
      className={!category.numItems ? 'co-catalog-tab__empty' : null}
      onActivate={onActivate}
      hasActiveDescendant={hasActiveDescendant}
      shown={shown}>
      {!_.isEmpty(subcategories) && <VerticalTabs restrictTabs activeTab={this.activeTabIsSubCategory(subcategories)}>
        {_.map(subcategories, subcategory => this.renderTabs(subcategory, id))}
      </VerticalTabs>}
    </VerticalTabs.Tab>;
  }

  renderCategoryTabs() {
    const { categories } = this.state;
    return <VerticalTabs restrictTabs activeTab={true} shown="true">
      {_.map(categories, (category) => this.renderTabs(category))}
    </VerticalTabs>;
  }

  syncTabsAndTiles(category, parentCategory) {
    const { categories } = this.state;
    if (!parentCategory && category === 'all') {
      this.setState({
        activeTabs: [category],
        currentCategories: categories,
        numItems: _.first(categories).numItems,
        showAllItemsForCategory: null,
      });
      return;
    }

    const { currentCategories } = this.state;
    const tmpCategories = parentCategory ? currentCategories : categories;
    const activeCategory = _.find(tmpCategories, { id: category });
    if (!activeCategory) {
      return;
    }

    const { numItems, subcategories } = activeCategory;
    const state = {
      activeTabs: parentCategory ? [parentCategory, category] : [category],
      numItems: numItems || 0,
    };
    if (_.isEmpty(subcategories)) {
      // no sub-categories, show all items for selected category
      _.assign(state, {
        currentCategories: categories,
        showAllItemsForCategory: category,
      });
    } else {
      // show list of sub-categories
      _.assign(state, {
        currentCategories: subcategories,
        showAllItemsForCategory: null,
      });
    }
    this.setState(state);
  }

  onActivateTab(tabs) {
    const category = _.last(tabs);
    const parent = tabs.length > 1 ? _.first(tabs) : null;
    this.syncTabsAndTiles(category, parent);
  }

  onItemClick (href) {
    history.push(href);
  }

  renderCategoryTiles(category) {
    const { showAllItemsForCategory } = this.state;
    const { id, label, parentCategory, items } = category;
    if (showAllItemsForCategory && id !== showAllItemsForCategory) {
      return null;
    }

    return <CatalogTileView.Category
      key={id}
      title={label}
      totalItems={items && category.items.length}
      viewAll={showAllItemsForCategory === id}
      onViewAll={() => this.syncTabsAndTiles(id, parentCategory)}>
      {_.map(items, ((item) => {
        const { obj, tileName, tileImgUrl, tileIconClass, tileProvider, tileDescription, href } = item;
        const uid = obj.metadata.uid;
        const iconClass = tileIconClass ? `icon ${normalizeIconClass(tileIconClass)}` : null;
        const vendor = tileProvider ? `Provided by ${tileProvider}` : null;
        return (
          <CatalogTile
            id={uid}
            key={uid}
            onClick={() => this.onItemClick(href)}
            title={tileName}
            iconImg={tileImgUrl}
            iconClass={iconClass}
            vendor={vendor}
            description={tileDescription} />
        );
      }))}
    </CatalogTileView.Category>;
  }

  getCategoryLabel(categoryID) {
    const { categories } = this.state;
    return _.find(categories, { id: categoryID }).label;
  }

  filterByKeyword(items) {
    const { filters } = this.state;
    const { byKeyword } = filters;

    const filterString = byKeyword.value.toLowerCase();
    return _.filter(items, item => item.tileName.toLowerCase().includes(filterString) ||
      item.tileDescription.toLowerCase().includes(filterString) ||
      item.tags.includes(filterString));
  }

  filterItems() {
    const { filters } = this.state;
    const { byKeyword, byType } = filters;
    const { items } = this.props;

    if (!this.hasActiveFilters(filters) ) {
      return items;
    }

    let filteredItems = [];

    if (byType.clusterServiceClass.active) {
      filteredItems = _.filter(items, { kind: byType.clusterServiceClass.value });
    }

    if (byType.imageStream.active) {
      filteredItems = filteredItems.concat(_.filter(items, { kind: byType.imageStream.value }));
    }

    if (byKeyword.active) {
      return this.filterByKeyword(byType.clusterServiceClass.active || byType.imageStream.active ? filteredItems : items);
    }

    return filteredItems;
  }

  filterItemsForCounts(filters) {
    const { byKeyword } = filters;
    const { items } = this.props;

    if (byKeyword.active) {
      return this.filterByKeyword(items);
    }

    return items;
  }

  clearFilters() {
    const filters = _.cloneDeep(this.state.filters);
    filters.byKeyword.active = filters.byType.clusterServiceClass.active = filters.byType.imageStream.active = false;
    filters.byKeyword.value = '';
    this.filterByKeywordInput.focus();
    this.setState({filters});
  }

  onFilterChange(filterType, id, value) {
    const filters = _.cloneDeep(this.state.filters);
    if (filterType === 'byKeyword') {
      const active = !!value;
      filters[filterType] = { active, value };
    } else {
      filters[filterType][id].active = value;
    }
    this.setState({filters});
  }

  render() {
    const { activeTabs, showAllItemsForCategory, currentCategories, numItems, filters, filterCounts } = this.state;
    const { clusterServiceClass, imageStream } = filters.byType;
    const { clusterServiceClasses, imageStreams } = filterCounts.byType;
    const activeCategory = showAllItemsForCategory ? _.find(currentCategories, { id: showAllItemsForCategory }) : null;
    const heading = activeCategory ? activeCategory.label : this.getCategoryLabel(_.first(activeTabs));

    return (
      <div className="co-catalog-page">
        <div className="co-catalog-page__tabs">
          { this.renderCategoryTabs() }
          <FilterSidePanel>
            <FilterSidePanel.Category onSubmit={(e) => e.preventDefault()}>
              <FormControl type="text" inputRef={(ref) => this.filterByKeywordInput = ref} placeholder="Filter by keyword..." bsClass="form-control"
                value={filters.byKeyword.value} autoFocus={true}
                onChange={e => this.onFilterChange('byKeyword', null, e.target.value)}
              />
            </FilterSidePanel.Category>
            <FilterSidePanel.Category title="Type">
              <FilterSidePanel.CategoryItem
                count={clusterServiceClasses}
                checked={clusterServiceClass.active}
                onChange={e => this.onFilterChange('byType', 'clusterServiceClass', e.target.checked)}
              >
                {clusterServiceClass.label}
              </FilterSidePanel.CategoryItem>
              <FilterSidePanel.CategoryItem
                count={imageStreams}
                checked={imageStream.active}
                onChange={e => this.onFilterChange('byType', 'imageStream', e.target.checked)}
              >
                {imageStream.label}
              </FilterSidePanel.CategoryItem>
            </FilterSidePanel.Category>
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
              No catalog items are being shown due to the filters being applied.
            </EmptyState.Info>
            <EmptyState.Help>
              <button type="text" className="btn btn-link" onClick={() => this.clearFilters()}>Clear All Filters</button>
            </EmptyState.Help>
          </EmptyState>
          }
        </div>
      </div>
    );
  }
}

CatalogTileViewPage.displayName = 'CatalogTileViewPage';
CatalogTileViewPage.propTypes = {
  items: PropTypes.array,
};
