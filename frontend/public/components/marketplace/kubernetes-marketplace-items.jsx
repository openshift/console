import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {Icon} from 'patternfly-react';
import {CatalogTile} from 'patternfly-react-extensions';

import {history} from '../utils/router';
import {normalizeIconClass} from '../catalog/catalog-item-icon';
import {MarketplaceItemModal} from './marketplace-item-modal';
import {TileViewPage} from '../utils/tile-view-page';
import {requireOperatorGroup} from '../operator-lifecycle-manager/operator-group';

// Filter property white list
const marketplaceFilterGroups = [
  'provider',
];

const ignoredProviderTails = [', Inc.', ', Inc', ' Inc.', ' Inc', ', LLC', ' LLC'];

const determineCategories = items => {
  const newCategories = {};
  _.each(items, item => {
    _.each(item.categories, category => {
      if (!newCategories[category]) {
        newCategories[category] = {
          id: category,
          label: category,
          field: 'categories',
          values: [category],
        };
      }
    });
  });

  return newCategories;
};

export const getProviderValue = value => {
  if (!value) {
    return value;
  }

  const providerTail = _.find(ignoredProviderTails, tail => value.endsWith(tail));
  if (providerTail) {
    return value.substring(0, value.indexOf(providerTail));
  }

  return value;
};

const determineAvailableFilters = (initialFilters, items, filterGroups) => {
  const filters = _.cloneDeep(initialFilters);

  _.each(filterGroups, field => {
    _.each(items, item => {
      let value = item[field];
      let synonyms;
      if (field === 'provider') {
        value = getProviderValue(value);
        synonyms = _.map(ignoredProviderTails, tail => `${value}${tail}`);
      }
      if (value) {
        _.set(filters, [field, value], {
          label: value,
          synonyms,
          value,
          active: false,
        });
      }
    });
  });

  return filters;
};

export const keywordCompare = (filterString, item) => {
  if (!filterString) {
    return true;
  }
  if (!item) {
    return false;
  }

  return item.name.toLowerCase().includes(filterString) ||
    (item.description && item.description.toLowerCase().includes(filterString)) ||
    (item.tags && item.tags.includes(filterString));
};

const setURLParams = params => {
  const url = new URL(window.location);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

class MarketplaceTileView extends React.Component {
  constructor(props) {
    super(props);

    this.state = { detailsItem: null };

    this.openOverlay = this.openOverlay.bind(this);
    this.closeOverlay = this.closeOverlay.bind(this);
    this.renderTile = this.renderTile.bind(this);
  }

  componentDidMount() {
    const {items} = this.props;
    const searchParams = new URLSearchParams(window.location.search);
    const detailsItemID = searchParams.get('details-item');
    const detailsItem = detailsItemID && _.find(items, {uid: detailsItemID});

    this.setState({detailsItem});
  }

  openOverlay(detailsItem) {
    const params = new URLSearchParams(window.location.search);
    params.set('details-item', detailsItem.uid);
    setURLParams(params);

    this.setState({detailsItem});
  }

  closeOverlay() {
    const params = new URLSearchParams(window.location.search);
    params.delete('details-item');
    setURLParams(params);

    this.setState({detailsItem: null});
  }

  renderTile(item) {
    if (!item) {
      return null;
    }

    const { uid, name, imgUrl, iconClass, provider, description, enabled } = item;
    const normalizedIconClass = iconClass && `icon ${normalizeIconClass(iconClass)}`;
    const vendor = provider ? `provided by ${provider}` : null;

    return (
      <CatalogTile
        id={uid}
        key={uid}
        title={name}
        iconImg={imgUrl}
        iconClass={normalizedIconClass}
        vendor={vendor}
        description={description}
        onClick={() => this.openOverlay(item)}
        footer={enabled ? <span><Icon type="pf" name="ok" /> Enabled</span> : null}
      />
    );
  }

  render() {
    const { items, catalogsourceconfigs } = this.props;
    const { detailsItem } = this.state;

    return (
      <React.Fragment>
        <TileViewPage
          items={items}
          itemsSorter={(itemsToSort) => _.sortBy(itemsToSort, 'name')}
          getAvailableCategories={determineCategories}
          getAvailableFilters={determineAvailableFilters}
          filterGroups={marketplaceFilterGroups}
          keywordCompare={keywordCompare}
          renderTile={this.renderTile}
          emptyStateInfo="No marketplace items are being shown due to the filters being applied."
        />
        <MarketplaceItemModal show={!!detailsItem} item={detailsItem} close={() => this.closeOverlay()} catalogsourceconfigs={catalogsourceconfigs} />
      </React.Fragment>
    );
  }
}

MarketplaceTileView.displayName = 'MarketplaceTileView';
MarketplaceTileView.propTypes = {
  items: PropTypes.array,
  catalogsourceconfigs: PropTypes.object,
};

const MarketplaceTileViewPage = requireOperatorGroup(MarketplaceTileView);

export {MarketplaceTileViewPage};
