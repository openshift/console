/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Button, Icon, Modal } from 'patternfly-react';
import { CatalogTile, FilterSidePanel } from 'patternfly-react-extensions';

import { COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY } from '../../const';
import { history } from '../utils/router';
import { TileViewPage } from '../utils/tile-view-page';
import { requireOperatorGroup } from '../operator-lifecycle-manager/operator-group';
import { K8sResourceKind } from '../../module/k8s';
import { normalizeIconClass } from '../catalog/catalog-item-icon';
import { OperatorHubItemDetails } from './operator-hub-item-details';
import { OperatorHubCommunityProviderModal } from './operator-hub-community-provider-modal';

const ignoredProviderTails = [', Inc.', ', Inc', ' Inc.', ' Inc', ', LLC', ' LLC'];

const COMMUNITY_PROVIDER_TYPE: string = 'Community';

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

const setURLParams = params => {
  const location: any = window.location;
  const url = new URL(location);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
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

export const OperatorHubTileView = requireOperatorGroup(
  class MarketplaceTileView extends TileViewPage {
    // Filter property white list
    filterGroups = [
      'providerType',
      'provider',
      'installState',
    ];

    filterGroupNameMap = {
      providerType: 'Provider Type',
      installState: 'Installed',
    };

    emptyStateInfo = 'No Operator Hub items are being shown due to the filters being applied.';

    pageDescription = (
      <span>
        Discover Operators from the Kubernetes community and Red Hat partners, curated by Red Hat.
        Operators can be installed on your clusters to provide optional add-ons and shared services to your developers.
        Once installed, the capabilities provided by the Operator appear in the <a href="/catalog">Developer Catalog</a>,
        providing a self-service experience.
      </span>
    );

    constructor(props) {
      super(props);

      _.set(this.state, 'detailsItem', null );

      this.openOverlay = this.openOverlay.bind(this);
      this.closeOverlay = this.closeOverlay.bind(this);
      this.renderTile = this.renderTile.bind(this);
      this.sortFilterValues = this.sortFilterValues.bind(this);
    }

    componentDidMount() {
      super.componentDidMount();
      localStorage.setItem(COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY, 'false');

      const {items} = this.props;
      const searchParams = new URLSearchParams(window.location.search);
      const detailsItemID = searchParams.get('details-item');
      const includeCommunityOperators = searchParams.get('community-operators') === 'true';
      const communityOperatorsExist = _.some(items, item => item.providerType === COMMUNITY_PROVIDER_TYPE);

      let stateItems = items;
      if (communityOperatorsExist && !includeCommunityOperators) {
        stateItems = _.filter(items, item => item.providerType !== COMMUNITY_PROVIDER_TYPE);
      }

      const detailsItem = detailsItemID && _.find(stateItems, {uid: detailsItemID});

      this.setState({detailsItem, items: stateItems, communityOperatorsExist, includeCommunityOperators});
    }

    componentDidUpdate(prevProps, prevState) {
      const {items} = this.props;
      const {includeCommunityOperators} = this.state;

      super.componentDidUpdate(prevProps, prevState);

      if (!_.isEqual(items, prevProps.items)) {
        const communityOperatorsExist = _.some(items, item => item.providerType === COMMUNITY_PROVIDER_TYPE);
        let stateItems = items;
        if (communityOperatorsExist && !includeCommunityOperators) {
          stateItems = _.filter(items, item => item.providerType !== COMMUNITY_PROVIDER_TYPE);
        }
        this.setState({items: stateItems, communityOperatorsExist});
      }
    }

    getAvailableCategories = (items) => {
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

    providerSort(provider) {
      if (provider.value.toLowerCase() === 'red hat') {
        return '';
      }
      return provider.value;
    }

    providerTypeSort(provider) {
      switch (provider.value) {
        case 'Red Hat':
          return 0;
        case 'Red Hat Partner':
          return 1;
        case 'Community':
          return 2;
        case 'Custom':
          return 4;
        default:
          return 5;
      }
    }

    installedStateSort(provider) {
      switch (provider.value) {
        case 'Installed':
          return 0;
        case 'Not Installed':
          return 1;
        default:
          return 3;
      }
    }

    sortFilterValues(values, field) {
      let sorter: any = ['value'];

      if (field === 'provider') {
        sorter = this.providerSort;
      }

      if (field === 'providerType') {
        sorter = this.providerTypeSort;
      }

      if (field === 'installState') {
        sorter = this.installedStateSort;
      }

      return _.sortBy(values, sorter);
    }

    getAvailableFilters = (initialFilters, items) => {
      const filters = _.cloneDeep(initialFilters);

      _.each(this.filterGroups, field => {
        const values = [];
        _.each(items, item => {
          let value = item[field];
          let synonyms;
          if (field === 'provider') {
            value = getProviderValue(value);
            synonyms = _.map(ignoredProviderTails, tail => `${value}${tail}`);
          }
          if (value !== undefined) {
            if (!_.some(values, {value})) {
              values.push({
                label: value,
                synonyms,
                value,
                active: false,
              });
            }
          }
        });

        if (values.length > 1) {
          _.forEach(this.sortFilterValues(values, field), (nextValue: any) => _.set(filters, [field, nextValue.value], nextValue));
        }
      });

      return filters;
    };

    itemsSorter = itemsToSort => {
      return _.sortBy(itemsToSort, 'name');
    };

    keywordCompare = keywordCompare;

    openOverlay(detailsItem) {
      const params = new URLSearchParams(window.location.search);
      params.set('details-item', detailsItem.uid);
      setURLParams(params);

      this.setState({detailsItem});
    }

    closeOverlay = () => {
      const params = new URLSearchParams(window.location.search);
      params.delete('details-item');
      setURLParams(params);

      this.setState({detailsItem: null});
    }

    onIncludeCommunityOperatorsToggle = () => {
      const {items} = this.props;
      const {includeCommunityOperators, activeFilters} = this.state;

      if (!includeCommunityOperators) {
        const ignoreWarning = localStorage.getItem(COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY);
        if (ignoreWarning === 'true') {
          this.showCommunityOperators(true);
          return;
        }

        this.setState({ communityModalShown: true });
        return;
      }

      const stateItems = _.filter(items, item => item.providerType !== COMMUNITY_PROVIDER_TYPE);
      const params = new URLSearchParams(window.location.search);
      params.delete('community-operators');
      setURLParams(params);

      /* Clear the community filter if it is active */
      let updatedFilters = activeFilters;
      if (_.get(activeFilters, 'providerType.Community.active')) {
        const groupFilter = _.cloneDeep(activeFilters.providerType);
        _.set(groupFilter, [COMMUNITY_PROVIDER_TYPE, 'active'], false);
        this.updateURLParams('providerType', this.getFilterSearchParam(groupFilter));
        updatedFilters = this.updateActiveFilters(activeFilters, 'providerType', COMMUNITY_PROVIDER_TYPE, false);
      }

      this.setState({items: stateItems, includeCommunityOperators: false, activeFilters: updatedFilters});
    };

    showCommunityOperators = (show: boolean, ignoreWarning: boolean = false) => {
      if (show) {
        const { items } = this.props;
        const params = new URLSearchParams(window.location.search);
        params.set('community-operators', 'true');
        setURLParams(params);

        this.setState({items, includeCommunityOperators: true, communityModalShown: false});

        if (ignoreWarning) {
          localStorage.setItem(COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY, 'true');
        }
      } else {
        this.setState({communityModalShown: false} );
      }
    };

    // eslint-disable-next-line react/display-name
    renderFilterGroup = (filterGroup, groupName) => {
      const { includeCommunityOperators, communityOperatorsExist } = this.state;
      return <FilterSidePanel.Category
        key={groupName}
        title={this.filterGroupNameMap[groupName] || groupName}
      >
        {_.map(filterGroup, (filter, filterName) => {
          return this.renderFilterItem(filter, filterName, groupName);
        })}
        {groupName === 'providerType' && communityOperatorsExist && (
          <Button bsStyle="link" className="co-catalog-page__filter-toggle" onClick={this.onIncludeCommunityOperatorsToggle}>
            {includeCommunityOperators ? 'Hide Community Operators' : 'Show Community Operators'}
          </Button>
        )}
      </FilterSidePanel.Category>;
    };

    // eslint-disable-next-line react/display-name
    renderTile = item => {
      if (!item) {
        return null;
      }

      const { uid, name, imgUrl, iconClass, provider, description, installed } = item;
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
          footer={installed ? <span><Icon type="pf" name="ok" /> Installed</span> : null}
        />
      );
    };

    renderPageItems() {
      const { detailsItem, communityModalShown } = this.state;

      return (
        <React.Fragment>
          <Modal show={!!detailsItem} onHide={this.closeOverlay} bsSize={'lg'} className="co-catalog-page__overlay right-side-modal-pf">
            {detailsItem && <OperatorHubItemDetails item={detailsItem} closeOverlay={this.closeOverlay} />}
          </Modal>
          <OperatorHubCommunityProviderModal show={communityModalShown} close={this.showCommunityOperators} />
        </React.Fragment>
      );
    }
  }
);

OperatorHubTileView.propTypes = {
  items: PropTypes.array,
  catalogSourceConfig: PropTypes.object,
};

export type OperatorHubTileViewProps = {
  items: any[];
  catalogSourceConfig: K8sResourceKind;
};

export type OperatorHubTileViewState = {
  detailsItem: any;
};

OperatorHubTileView.displayName = 'OperatorHubTileView';
