import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {Helmet} from 'react-helmet';
import {CatalogTile} from 'patternfly-react-extensions/dist/esm/components/CatalogTile';

import {PageHeading} from '../utils';
import {history} from '../utils/router';
import {normalizeIconClass} from '../catalog/catalog-item-icon';
import {MarketplaceItemModal} from './marketplace-item-modal';
import {TileViewPage} from '../utils/tile-view-page';
import {k8sCreate} from '../../module/k8s';
import {CatalogSourceConfigModel} from '../../models';
import {AdminSubscribe} from './kubernetes-marketplace-subscribe'


// Filter property white list
const marketplaceFilterGroups = [
  'provider',
];

const ignoredProviderTails = [', Inc.', ', Inc', ' Inc.', ' Inc', ', LLC', ' LLC'];

export class MarketplaceTileViewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      detailsItem: null,
      showSubscribe: null 
    };

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

  static determineCategories(items) {
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
  }


  static getProviderValue(value) {
    if (!value) {
      return value;
    }

    const providerTail = _.find(ignoredProviderTails, tail => value.endsWith(tail));
    if (providerTail) {
      return value.substring(0, value.indexOf(providerTail));
    }

    return value;
  }

  static determineAvailableFilters(initialFilters, items, filterGroups) {
    const filters = _.cloneDeep(initialFilters);

    _.each(filterGroups, field => {
      _.each(items, item => {
        let value = item[field];
        let synonyms;
        if (field === 'provider') {
          value = MarketplaceTileViewPage.getProviderValue(value);
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

  showSubscribePage() {
    this.setState({
      showSubscribe : true
    })
  }
  
  hideSubscribePage() {
    this.setState({
      showSubscribe : null,
      detailsItem: null
    })
  }

  subscribe(targetNamespace) {
    // Subscribe to operator by creating catalogSourceConfig in a given namespace
    const {name} = this.state.detailsItem;
    const catalogSourceConfig = {
      apiVersion: 'marketplace.redhat.com/v1alpha1',
      kind: 'CatalogSourceConfig',
      metadata: {
        name: `${name}`,
        namespace: "marketplace",
      },
      spec: {
        targetNamespace: `${targetNamespace}`,
        packages: `${name}`,
      },
    };

    // This returns a promise, should add some error checking on this
    k8sCreate(CatalogSourceConfigModel, catalogSourceConfig);

    this.hideSubscribePage();
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
    const { detailsItem, showSubscribe } = this.state;

    return (
      !showSubscribe ?
      <React.Fragment>
        <Helmet>
          <title>Kubernetes Marketplace</title>
        </Helmet>
        <div className="co-catalog">
          <PageHeading title="Kubernetes Marketplace" />
          <TileViewPage
            items={items}
            itemsSorter={(itemsToSort) => _.sortBy(itemsToSort, 'name')}
            getAvailableCategories={MarketplaceTileViewPage.determineCategories}
            getAvailableFilters={MarketplaceTileViewPage.determineAvailableFilters}
            filterGroups={marketplaceFilterGroups}
            keywordCompare={MarketplaceTileViewPage.keywordCompare}
            renderTile={this.renderTile}
            emptyStateInfo="No marketplace items are being shown due to the filters being applied."
          />
          <MarketplaceItemModal show={!!detailsItem} item={detailsItem} close={() => this.closeOverlay()} openSubscribe={() => this.showSubscribePage()} />
        </div>
      </React.Fragment>
      :
      <AdminSubscribe item={detailsItem} close={() => this.hideSubscribePage()} subscribe={(targetNamespace) => this.subscribe(targetNamespace)}/>
    );
  }
}

MarketplaceTileViewPage.displayName = 'MarketplaceTileViewPage';
MarketplaceTileViewPage.propTypes = {
  items: PropTypes.array,
};
