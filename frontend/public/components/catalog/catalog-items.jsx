import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {CatalogTileView} from 'patternfly-react-extensions/dist/js/components/CatalogTileView';
import {CatalogTile} from 'patternfly-react-extensions/dist/js/components/CatalogTile';
import {VerticalTabs} from 'patternfly-react-extensions/dist/js/components/VerticalTabs';
import {FilterSidePanel} from 'patternfly-react-extensions/dist/js/components/FilterSidePanel';
import {EmptyState} from 'patternfly-react/dist/js/components/EmptyState';
import FormControl from 'patternfly-react/dist/js/components/Form/FormControl';
import {Modal} from 'patternfly-react/dist/js/components/Modal';

import {normalizeIconClass} from './catalog-item-icon';
import {categorizeItems, recategorizeItems} from '../utils/categorize-catalog-items';
import {CatalogTileDetails} from './catalog-item-details';
import {history} from '../utils';

const CATEGORY_URL_PARAM = 'category';
const KEYWORD_URL_PARAM = 'keyword';
const TYPE_URL_PARAM = 'by-type';

const defaultFilters = {
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
  },
};

const defaultFilterCounts = {
  byType: {
    clusterServiceClasses: 0,
    imageStreams: 0,
  },
};

export class CatalogTileViewPage extends React.Component {
  constructor(props) {
    super(props);

    /* saving in state
      {
        categories: set of categories and subcategories based on passed in items.  Initially, empty categories are
          removed. Subsequent filtering may result in empty categories.
        currentCategories: categories/subcategories to list in the right hand CatalogTileView
        selectedCategory: category selected from left hand tabs or from url
        showAllItemsForCategory: flag to show all items/tiles for selected category
        filters: active filters from left side panel or url
        filterCounts: number of items that match each filter type
        numItems: displayed in title above CatalogTileView
      }
    */
    this.state = {
      categories: categorizeItems(props.items),
      currentCategories: null,
      selectedCategory: null,
      showAllItemsForCategory: false,
      filters: defaultFilters,
      filterCounts: defaultFilterCounts,
      numItems: 0,
    };

    this.openOverlay = this.openOverlay.bind(this);
    this.closeOverlay = this.closeOverlay.bind(this);
    this.unmounted = false;
  }

  componentDidMount() {
    this.setState(this.getUpdatedStateFromURLParams(window.location.search));
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  componentDidUpdate(prevProps) {
    const { filters, selectedCategory } = this.state;
    const { items } = this.props;

    if (items !== prevProps.items) {
      const categories = categorizeItems(items);
      this.setState(this.getUpdatedState(categories, selectedCategory, filters));
    }
  }

  getUpdatedState(categories, selectedCategory, filters) {
    const { items } = this.props;
    const { filterCounts } = this.state || {};

    if (!items) {
      return;
    }

    const updateFilterCounts = filterCounts ||
      {
        byType: {
          clusterServiceClasses: 0,
          imageStreams: 0,
        },
      };

    const filteredItems = this.filterItems(items, filters);

    const newCategories = recategorizeItems(filteredItems, categories);

    return {
      filters,
      ...CatalogTileViewPage.getCategoryState(selectedCategory, newCategories),
      filterCounts: this.getFilterCounts(selectedCategory, filters, updateFilterCounts, newCategories),
    };
  }

  getUpdatedStateFromURLParams(paramsString) {
    const { categories } = this.state;
    const searchParams = new URLSearchParams(paramsString);
    const categoryParam = searchParams.get(CATEGORY_URL_PARAM);
    const keywordParam = searchParams.get(KEYWORD_URL_PARAM);
    const byTypeParam = searchParams.get(TYPE_URL_PARAM);
    try {
      const typeFilters = byTypeParam ? JSON.parse(byTypeParam) : [];
      const curCategory = categoryParam ? JSON.parse(categoryParam) : ['all'];
      const filters = CatalogTileViewPage.getFilterState(keywordParam, typeFilters, defaultFilters);
      return this.getUpdatedState(categories, curCategory, filters);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('could not update state from url params: could not parse search params');
    }
  }

  static hasActiveFilters(filters) {
    const { byKeyword, byType } = filters;
    return byType.clusterServiceClass.active || byType.imageStream.active || byKeyword.active;
  }

  static getActiveCategories(selectedCategory, categories) {
    const mainCategory = _.find(categories, { id: _.first(selectedCategory) });
    const subCategory = selectedCategory.length < 2 ? null : _.find(mainCategory.subcategories, { id: _.last(selectedCategory) });
    return [mainCategory, subCategory];
  }

  static getFilterState(keyword, byType, filters) {
    const newFilters = _.cloneDeep(filters);
    const active = !!keyword;
    newFilters.byKeyword = { active, value: keyword || '' };
    newFilters.byType.clusterServiceClass.active = _.includes(byType, 'clusterServiceClass');
    newFilters.byType.imageStream.active = _.includes(byType, 'imageStream');

    return newFilters;
  }

  getFilterCounts(selectedCategory, filters, filterCounts, categories) {
    const filteredItems = this.filterItemsForCounts(filters);
    const categoriesForCounts = recategorizeItems(filteredItems, categories);

    const [ mainCategory, subCategory ] = CatalogTileViewPage.getActiveCategories(selectedCategory, categoriesForCounts);
    const items = subCategory ? subCategory.items : mainCategory.items;

    const count = _.countBy(items, 'kind');
    const newFilterCounts = {...filterCounts};
    newFilterCounts.byType.clusterServiceClasses = count.ClusterServiceClass || 0;
    newFilterCounts.byType.imageStreams = count.ImageStream || 0;

    return newFilterCounts;
  }

  static getCategoryState(selectedCategory, categories) {
    const [ mainCategory, subCategory ] = CatalogTileViewPage.getActiveCategories(selectedCategory, categories);
    const currentCategories = mainCategory.subcategories || categories;
    const numItems = subCategory ? subCategory.numItems : mainCategory.numItems;
    // showAllItemsForCategory if main category doesn't contain subcategories and not showing 'all categories' (ie. 'Other') OR subcategory has been selected
    const showAllItemsForCategory = (_.isEmpty(mainCategory.subcategories) && _.first(selectedCategory) !== 'all') || subCategory !== null ? _.last(selectedCategory) : null;

    return {
      categories,
      selectedCategory,
      currentCategories,
      numItems: numItems || 0,
      showAllItemsForCategory,
    };
  }

  activeTabIsSubCategory(subcategories) {
    const { selectedCategory } = this.state;
    if (_.size(selectedCategory) < 2) {
      return false;
    }

    const activeID = _.last(selectedCategory);
    return _.some(subcategories, { id: activeID });
  }

  isActiveTab(categoryID) {
    const { selectedCategory } = this.state;
    const activeID = _.last(selectedCategory);
    return activeID === categoryID;
  }

  hasActiveDescendant(categoryID) {
    const { selectedCategory } = this.state;
    return _.first(selectedCategory) === categoryID;
  }

  renderTabs(category, parentID = null){
    const { id, label, subcategories } = category;
    const active = this.isActiveTab(id);
    const onActivate = () => {
      const selectedCategory = parentID ? [parentID, id] : [id];
      this.selectCategory(selectedCategory);
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

  selectCategory(selectedCategory) {
    this.updateURL(CATEGORY_URL_PARAM, selectedCategory);
  }

  openOverlay(item) {
    this.setState({
      item,
      showOverlay: true,
    });
  }

  closeOverlay() {
    this.setState({
      showOverlay: false,
      item: null,
    });
  }

  renderCategoryTiles(category) {
    const { showAllItemsForCategory } = this.state;
    const { id, label, parentCategory, items } = category;
    const selectedCategory = parentCategory ? [parentCategory, id] : [id];

    if (showAllItemsForCategory && id !== showAllItemsForCategory) {
      return null;
    }

    return <CatalogTileView.Category
      key={id}
      title={label}
      totalItems={items && category.items.length}
      viewAll={showAllItemsForCategory === id}
      onViewAll={() => this.selectCategory(selectedCategory)}>
      {_.map(items, ((item) => {
        const { obj, tileName, tileImgUrl, tileIconClass, tileProvider, tileDescription } = item;
        const uid = obj.metadata.uid;
        const iconClass = tileIconClass ? normalizeIconClass(tileIconClass) : null;
        const vendor = tileProvider ? `Provided by ${tileProvider}` : null;
        return (
          <CatalogTile
            id={uid}
            key={uid}
            onClick={() => this.openOverlay(item)}
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
    if (!categoryID || !categories) {
      return '';
    }

    return _.find(categories, { id: categoryID }).label;
  }

  filterByKeyword(keyword, items) {
    const filterString = keyword.toLowerCase();
    return _.filter(items, item => item.tileName.toLowerCase().includes(filterString) ||
      item.tileDescription.toLowerCase().includes(filterString) ||
      item.tags.includes(filterString));
  }

  filterItems(items, filters) {
    const { byKeyword, byType } = filters;

    if (!CatalogTileViewPage.hasActiveFilters(filters) ) {
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
      return this.filterByKeyword(filters.byKeyword.value, byType.clusterServiceClass.active || byType.imageStream.active ? filteredItems : items);
    }

    return filteredItems;
  }

  filterItemsForCounts(filters) {
    const { byKeyword } = filters;
    const { items } = this.props;

    if (byKeyword.active) {
      return this.filterByKeyword(byKeyword.value, items);
    }

    return items;
  }

  clearFilters() {
    const params = new URLSearchParams(window.location.search);
    params.delete(KEYWORD_URL_PARAM);
    params.delete(TYPE_URL_PARAM);
    const url = new URL(window.location);
    const searchParams = `?${params.toString()}${url.hash}`;
    history.replace(`${url.pathname}${searchParams}`);
    if (this.unmounted) {
      return;
    }
    this.setState(this.getUpdatedStateFromURLParams(searchParams));
    this.filterByKeywordInput.focus();
  }

  updateURL(filterName, value) {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(filterName, Array.isArray(value) ? JSON.stringify(value) : value);
    } else {
      params.delete(filterName);
    }
    const url = new URL(window.location);
    const searchParams = `?${params.toString()}${url.hash}`;
    history.replace(`${url.pathname}${searchParams}`);
    // do not set state if unmounted, case for when history.replace taking too much time
    // and causes component to remount.  Noticeable in Safari
    if (this.unmounted) {
      return;
    }
    this.setState(this.getUpdatedStateFromURLParams(searchParams));
  }

  onFilterChange(filterType, id, value) {
    const { filters } = this.state;
    const { byType } = filters;
    let byTypeValues = [];

    if (filterType === 'byKeyword') {
      this.updateURL(KEYWORD_URL_PARAM, value);
    } else {
      if (value) {
        byTypeValues.push(id);
      }
      _.forOwn(byType, (typeKeyValue, typeKey) => {
        if (typeKey !== id && byType[typeKey].active) {
          byTypeValues.push(typeKey);
        }
      });
      this.updateURL(TYPE_URL_PARAM, _.isEmpty(byTypeValues) ? false : byTypeValues);
    }
  }

  render() {
    const { selectedCategory, showAllItemsForCategory, currentCategories, numItems, filters, filterCounts, showOverlay, item } = this.state;
    const { clusterServiceClass, imageStream } = filters.byType;
    const { clusterServiceClasses, imageStreams } = filterCounts.byType;
    const activeCategory = showAllItemsForCategory ? _.find(currentCategories, { id: showAllItemsForCategory }) : null;
    const heading = activeCategory ? activeCategory.label : this.getCategoryLabel(_.first(selectedCategory));

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
        <Modal show={showOverlay} onHide={this.closeOverlay} bsSize={'lg'} className="co-catalog-page__overlay right-side-modal-pf">
          {showOverlay && <CatalogTileDetails item={item} closeOverlay={this.closeOverlay} />}
        </Modal>
      </div>
    );
  }
}

CatalogTileViewPage.displayName = 'CatalogTileViewPage';
CatalogTileViewPage.propTypes = {
  items: PropTypes.array,
};
