import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {CatalogTileView} from 'patternfly-react-extensions/dist/esm/components/CatalogTileView';
import {CatalogTile} from 'patternfly-react-extensions/dist/esm/components/CatalogTile';
import {FilterSidePanel} from 'patternfly-react-extensions/dist/esm/components/FilterSidePanel';
import {EmptyState} from 'patternfly-react/dist/esm/components/EmptyState';
import FormControl from 'patternfly-react/dist/esm/components/Form/FormControl';

import {normalizeIconClass} from '../catalog/catalog-item-icon';

function getFilters(items, filterGroups=[]) {
  const filters = {
    keyword: {
      value: '',
      active: false,
    },
  };

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
}

function copyActiveFilters(filters, oldFilters) {
  // Applies active values in oldFilters to filters
  _.forOwn(filters, (groupValue, group) => {
    if (group !== 'keyword') {
      _.forOwn(filters[group], (filterValue, filter) => {
        filters[group][filter].active = _.get(oldFilters, [group, filter, 'active'], false);
      });
    }
  });

  if (_.get(oldFilters, ['keyword', 'active'])) {
    filters.keyword = oldFilters.keyword;
  }

  return filters;
}

// Filter property white list
const filterGroups = [
  'provider',
];

export class MarketplaceTileViewPage extends React.Component {
  constructor(props) {
    super(props);
    const {items} = this.props;

    // Filters are populated based on white list of item properties
    const filters = getFilters(items, filterGroups);

    this.state = {
      filters,
      ...this.getFilterItemsAndCounts(filters),
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const {filters} = this.state;
    const {items} = this.props;
    if ((items === prevProps.items) && (filters === prevState.filters)) {
      return;
    }

    const updatedState = {};

    // Update filters to match new items
    if (items !== prevProps.items) {
      const newFilters = getFilters(items, filterGroups);
      // Apply current filter state to new filters
      updatedState.filters = copyActiveFilters(newFilters, filters);
    }

    // If only filters have changed, update filter items and filter counts
    if (updatedState.filters || filters !== prevState.filters) {
      Object.assign(updatedState, this.getFilterItemsAndCounts(updatedState.filters || filters));
    }

    this.setState(updatedState);
  }

  getFilterItemsAndCounts(filters) {
    const { items } = this.props;

    const itemsAndCounts = {
      filteredItems: {},
      filterCounts: {},
    };

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
    const filteredItems = _.intersection(..._.values(filteredByGroup), filteredByKeyword);
    itemsAndCounts.filteredItems = _.sortBy(filteredItems, 'name');

    // Get counts for filtered items in each filter group
    itemsAndCounts.filterCounts = this.getFilterCountsFromGroups(filteredByKeyword, filters, filteredByGroup);

    return itemsAndCounts;
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

  getFilterCountsFromGroups(items, filters, itemsFilteredByGroup) {
    // Input items, filters, and mapping from filter property to filtered items
    // Returns object mapping filter property to item counts
    return _.reduce(filters, (counts, group, key) => {
      if (key === 'keyword') {
        return counts;
      }

      // Apply filters for all groups except for current group key
      const itemsByGroup = _.filter(itemsFilteredByGroup, (groupItems, groupName) => groupName !== key);
      const count = _.countBy(_.intersection(...itemsByGroup, items), key);

      counts[key] = _.reduce(group, (groupCounts, value, elem) => {
        groupCounts[elem] = count[elem] || 0;
        return groupCounts;
      }, {});

      return counts;
    }, {});
  }

  clearFilters() {
    const filters = _.cloneDeep(this.state.filters);
    _.forOwn(filters, (group, key) => {
      if (key === 'keyword') {
        _.set(filters, 'keyword', {
          active: false,
          value: '',
        });
      } else {
        _.forOwn(group, (cItem, elem) => {
          _.set(filters, [key, elem, 'active'], false);
        });
      }
    });
    this.setState({filters});
  }

  onFilterChange(filterType, id, value) {
    const filters = _.cloneDeep(this.state.filters);
    if (filterType === 'keyword') {
      const active = !!value;
      filters[filterType] = { active, value };
    } else {
      filters[filterType][id].active = value;
    }
    this.setState({filters});
  }

  renderTiles() {
    const items = this.state.filteredItems;
    const { openOverlay } = this.props;

    return (
      <CatalogTileView.Category totalItems={items.length} viewAll={true}>
        {_.map(items, item => {
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

  render() {
    const { filters, filterCounts, filteredItems } = this.state;

    return (
      <div className="co-catalog-page">
        <div className="co-catalog-page__tabs">
          <FilterSidePanel>
            <FilterSidePanel.Category key="keyword" onSubmit={(e) => e.preventDefault()}>
              <FormControl type="text" placeholder="Filter by keyword..." bsClass="form-control"
                value={filters.keyword.value}
                onChange={e => this.onFilterChange('keyword', null, e.target.value)}
              />
            </FilterSidePanel.Category>
            {_.map(filters, (filterGroup, groupName) => {
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
                    count={filterCounts[groupName][filterName]}
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
          <div className="co-catalog-page__num-items">{_.size(filteredItems)} items</div>
          {filteredItems.length > 0 && <CatalogTileView>
            {this.renderTiles()}
          </CatalogTileView>}
          {filteredItems.length === 0 && <EmptyState className="co-catalog-page__no-filter-results">
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
