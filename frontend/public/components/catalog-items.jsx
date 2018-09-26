import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {CatalogTileView} from 'patternfly-react-extensions/dist/esm/components/CatalogTileView';
import {CatalogTile} from 'patternfly-react-extensions/dist/esm/components/CatalogTile';
import {VerticalTabs} from 'patternfly-react-extensions/dist/esm/components/VerticalTabs';

import {normalizeIconClass} from './catalog-item-icon';
import {categorizeItems} from './utils/categorize-catalog-items';

export class CatalogTileViewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showAllItemsForCategory: null,
      activeTabs: ['all'], // array of tabs [main category, sub-category]
    };
  }

  static getDerivedStateFromProps(props) {
    const allCategories = categorizeItems(props.items);
    return {
      allCategories,
      currentCategories: allCategories,
      numItems: _.first(allCategories).numItems,
    };
  }

  isAllTabActive() {
    const { activeTabs } = this.state;
    return activeTabs[0] === 'all';
  }

  activeTabIsSubCategory(subcategories) {
    const { activeTabs } = this.state;
    if (_.size(activeTabs) < 2) {
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
    if (!category.numItems) {
      return null;
    }

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
      onActivate={onActivate}
      hasActiveDescendant={hasActiveDescendant}
      shown={shown}>
      {!_.isEmpty(subcategories) && <VerticalTabs restrictTabs activeTab={this.activeTabIsSubCategory(subcategories)}>
        {_.map(subcategories, subcategory => this.renderTabs(subcategory, id))}
      </VerticalTabs>}
    </VerticalTabs.Tab>;
  }

  renderCategoryTabs() {
    const { allCategories } = this.state;
    return <VerticalTabs restrictTabs activeTab={this.isAllTabActive()} shown="true">
      {_.map(allCategories, (category) => this.renderTabs(category))}
    </VerticalTabs>;
  }

  syncTabsAndTiles(category, parentCategory) {
    const { allCategories } = this.state;
    if (!parentCategory && category === 'all') {
      this.setState({
        activeTabs: [category],
        currentCategories: allCategories,
        numItems: _.first(allCategories).numItems,
        showAllItemsForCategory: null,
      });
      return;
    }

    const { currentCategories } = this.state;
    const categories = parentCategory ? currentCategories : allCategories;
    const activeCategory = _.find(categories, { id: category });
    if (!activeCategory) {
      return;
    }

    const { numItems, subcategories } = activeCategory;
    const state = {
      activeTabs: parentCategory ? [parentCategory, category] : [category],
      numItems,
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
        const catalogTile = <CatalogTile
          id={uid}
          key={uid}
          title={tileName}
          iconImg={tileImgUrl}
          iconClass={iconClass}
          vendor={vendor}
          description={tileDescription} />;
        return href ? <Link key={uid} className="co-catalog-item-tile" to={href}>{catalogTile}</Link> : catalogTile;
      }))}
    </CatalogTileView.Category>;
  }

  getCategoryLabel(categoryID) {
    const { allCategories } = this.state;
    return _.find(allCategories, { id: categoryID }).label;
  }

  render() {
    const { activeTabs, showAllItemsForCategory, currentCategories, numItems } = this.state;
    const activeCategory = showAllItemsForCategory ? _.find(currentCategories, { id: showAllItemsForCategory }) : null;
    const heading = activeCategory ? activeCategory.label : this.getCategoryLabel(_.first(activeTabs));

    return (
      <div className="co-catalog-page">
        <div className="co-catalog-page__tabs">
          { this.renderCategoryTabs() }
        </div>
        <div className="co-catalog-page__content">
          <div>
            <div className="co-catalog-page__heading">{heading}</div>
            <div className="co-catalog-page__num-items">{numItems} items</div>
          </div>
          <CatalogTileView>
            {activeCategory
              ? this.renderCategoryTiles(activeCategory)
              : _.map(currentCategories, category => (category.numItems && category.id !== 'all') ? this.renderCategoryTiles(category) : null)}
          </CatalogTileView>
        </div>
      </div>
    );
  }
}

CatalogTileViewPage.displayName = 'CatalogTileViewPage';
CatalogTileViewPage.propTypes = {
  items: PropTypes.array
};
