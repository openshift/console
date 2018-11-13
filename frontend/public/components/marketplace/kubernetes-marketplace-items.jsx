import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {CatalogTile} from 'patternfly-react-extensions/dist/esm/components/CatalogTile';

import {history} from '../utils/router';
import {normalizeIconClass} from '../catalog/catalog-item-icon';
import {MarketplaceItemModal} from './marketplace-item-modal';
import {TileViewPage} from '../utils/tile-view-page';

// Filter property white list
const filterGroups = [
  'provider',
];

export class MarketplaceTileViewPage extends React.Component {
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
    const detailsItemId = searchParams.get('details-item');
    const detailsItem = detailsItemId && _.find(items, {uid: detailsItemId});

    this.setState({detailsItem});
  }

  static determineCategories(items) {
    const newCategories = [];
    _.each(items, item => {
      _.each(item.categories, category => {
        if (!_.find(newCategories, { id: category })) {
          newCategories.push({
            id: category,
            label: category,
            field: 'categories',
            values: [category],
          });
        }
      });
    });

    return newCategories;
  }

  static keywordCompare(filterString, item) {
    if (!filterString) {
      return true;
    }
    if (!item) {
      return false;
    }

    return item.name.toLowerCase().includes(filterString) ||
      (item.description && item.description.toLowerCase().includes(filterString)) ||
      (item.tags && item.tags.includes(filterString));
  }

  static setURLParams(params) {
    const url = new URL(window.location);
    const searchParams = `?${params.toString()}${url.hash}`;

    history.replace(`${url.pathname}${searchParams}`);
  }

  openOverlay(detailsItem) {
    const params = new URLSearchParams(window.location.search);
    params.set('details-item', detailsItem.uid);
    MarketplaceTileViewPage.setURLParams(params);

    this.setState({detailsItem});
  }

  closeOverlay() {
    const params = new URLSearchParams(window.location.search);
    params.delete('details-item');
    MarketplaceTileViewPage.setURLParams(params);

    this.setState({detailsItem: null});
  }

  renderTile(item) {
    if (!item) {
      return null;
    }

    const { uid, name, imgUrl, iconClass, provider, description } = item;
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
      />
    );
  }

  render() {
    const { items } = this.props;
    const { detailsItem } = this.state;

    return (
      <React.Fragment>
        <TileViewPage
          items={items}
          itemsSorter={(itemsToSort) => _.sortBy(itemsToSort, 'name')}
          getAvailableCategories={MarketplaceTileViewPage.determineCategories}
          filterGroups={filterGroups}
          keywordCompare={MarketplaceTileViewPage.keywordCompare}
          renderTile={this.renderTile}
          emptyStateInfo="No marketplace items are being shown due to the filters being applied."
        />
        <MarketplaceItemModal show={!!detailsItem} item={detailsItem} close={() => this.closeOverlay()} openSubscribe={/* TODO */} />
      </React.Fragment>
    );
  }
}

MarketplaceTileViewPage.displayName = 'MarketplaceTileViewPage';
MarketplaceTileViewPage.propTypes = {
  items: PropTypes.array,
};
