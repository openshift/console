/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Icon, Modal } from 'patternfly-react';
import { CatalogTile } from 'patternfly-react-extensions';

import { history } from '../utils/router';
import { COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY } from '../../const';
import { K8sResourceKind } from '../../module/k8s';
import { requireOperatorGroup } from '../operator-lifecycle-manager/operator-group';
import { normalizeIconClass } from '../catalog/catalog-item-icon';
import { TileViewPage } from '../utils/tile-view-page';
import { OperatorHubItemDetails } from './operator-hub-item-details';
import { communityOperatorWarningModal } from './operator-hub-community-provider-modal';

const pageDescription = (
  <span>
    Discover Operators from the Kubernetes community and Red Hat partners, curated by Red Hat.
    Operators can be installed on your clusters to provide optional add-ons and shared services to your developers.
    Once installed, the capabilities provided by the Operator appear in the <a href="/catalog">Developer Catalog</a>,
    providing a self-service experience.
  </span>
);

const communityOperatorBadge = <span key="1" className="pf-c-badge pf-m-read">Community</span>;

/**
 * Filter property white list
 */
const operatorHubFilterGroups = [
  'providerType',
  'provider',
  'installState',
];

const operatorHubFilterMap = {
  providerType: 'Provider Type',
  installState: 'Install State',
};

const COMMUNITY_PROVIDER_TYPE: string = 'Community';

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

  const sortedKeys = _.keys(newCategories).sort((key1, key2) => key1.toLowerCase().localeCompare(key2.toLowerCase()));

  return _.reduce(sortedKeys, (categories, key) => {
    categories[key] = newCategories[key];
    return categories;
  }, {});
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

const providerSort = provider => {
  if (provider.value.toLowerCase() === 'red hat') {
    return '';
  }
  return provider.value;
};

const providerTypeSort = provider => {
  switch (provider.value) {
    case 'Red Hat':
      return 0;
    case 'Certified':
      return 1;
    case 'Community':
      return 2;
    case 'Custom':
      return 4;
    default:
      return 5;
  }
};

const installedStateSort = provider =>{
  switch (provider.value) {
    case 'Installed':
      return 0;
    case 'Not Installed':
      return 1;
    default:
      return 3;
  }
};

const sortFilterValues = (values, field) => {
  let sorter: any = ['value'];

  if (field === 'provider') {
    sorter = providerSort;
  }

  if (field === 'providerType') {
    sorter = providerTypeSort;
  }

  if (field === 'installState') {
    sorter = installedStateSort;
  }

  return _.sortBy(values, sorter);
};

const determineAvailableFilters = (initialFilters, items, filterGroups) => {
  const filters = _.cloneDeep(initialFilters);

  // Always show both install state filters
  filters.installState = {
    Installed: {
      label: 'Installed',
      value: 'Installed',
      active: false,
    },
    'Not Installed': {
      label: 'Not Installed',
      value: 'Not Installed',
      active: false,
    },
  };

  _.each(filterGroups, field => {
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

    _.forEach(sortFilterValues(values, field), (nextValue: any) => _.set(filters, [field, nextValue.value], nextValue));
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
    _.get(item, 'obj.metadata.name', '').toLowerCase().includes(filterString) ||
    (item.description && item.description.toLowerCase().includes(filterString)) ||
    (item.tags && item.tags.includes(filterString));
};

const setURLParams = params => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export const OperatorHubTileView = requireOperatorGroup(
  class OperatorHubTileView extends React.Component<OperatorHubTileViewProps, OperatorHubTileViewState> {
    constructor(props) {
      super(props);

      this.state = {
        detailsItem: null,
        showDetails: false,
        communityModalShown: false,
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

    showCommunityOperator = (ignoreWarning: boolean = false) => {
      const { detailsItem } = this.state;

      const params = new URLSearchParams(window.location.search);
      params.set('details-item', detailsItem.uid);
      setURLParams(params);
      this.setState({showDetails: true});

      if (ignoreWarning) {
        localStorage.setItem(COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY, 'true');
      }
    };

    openOverlay(detailsItem) {
      const ignoreWarning = localStorage.getItem(COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY) === 'true';

      if (!ignoreWarning && detailsItem.providerType === COMMUNITY_PROVIDER_TYPE) {
        this.setState({detailsItem});
        communityOperatorWarningModal({ showCommunityOperators: this.showCommunityOperator });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      params.set('details-item', detailsItem.uid);
      setURLParams(params);

      this.setState({detailsItem, showDetails: true});
    }

    closeOverlay() {
      const params = new URLSearchParams(window.location.search);
      params.delete('details-item');
      setURLParams(params);

      this.setState({detailsItem: null, showDetails: false});
    }

    renderTile(item) {
      if (!item) {
        return null;
      }

      const { uid, name, imgUrl, iconClass, provider, description, installed } = item;
      const normalizedIconClass = iconClass && `icon ${normalizeIconClass(iconClass)}`;
      const vendor = provider ? `provided by ${provider}` : null;

      const badges = item.providerType === COMMUNITY_PROVIDER_TYPE ? [communityOperatorBadge] : [];

      return (
        <CatalogTile
          key={uid}
          title={name}
          badges={badges}
          iconImg={imgUrl}
          iconClass={normalizedIconClass}
          vendor={vendor}
          description={description}
          onClick={() => this.openOverlay(item)}
          footer={installed ? <span><Icon type="pf" name="ok" /> Installed</span> : null}
          data-test={uid}
        />
      );
    }

    render() {
      const { detailsItem, showDetails } = this.state;
      const { items } = this.props;

      return <React.Fragment>
        <TileViewPage
          items={items}
          itemsSorter={(itemsToSort) => _.sortBy(itemsToSort, 'name')}
          getAvailableCategories={determineCategories}
          getAvailableFilters={determineAvailableFilters}
          filterGroups={operatorHubFilterGroups}
          filterGroupNameMap={operatorHubFilterMap}
          keywordCompare={keywordCompare}
          renderTile={this.renderTile}
          pageDescription={pageDescription}
          emptyStateInfo="No OperatorHub items are being shown due to the filters being applied."
        />
        <Modal show={!!detailsItem && showDetails} onHide={this.closeOverlay} bsSize="lg" className="co-catalog-page__overlay right-side-modal-pf">
          {detailsItem && <OperatorHubItemDetails namespace={this.props.namespace} item={detailsItem} closeOverlay={this.closeOverlay} />}
        </Modal>
      </React.Fragment>;
    }
  }
);

OperatorHubTileView.propTypes = {
  items: PropTypes.array,
  catalogSourceConfig: PropTypes.object,
};

export type OperatorHubTileViewProps = {
  namespace?: string;
  items: any[];
  catalogSourceConfig: K8sResourceKind;
};

export type OperatorHubTileViewState = {
  detailsItem: any;
  showDetails: boolean;
  communityModalShown: boolean;
};

OperatorHubTileView.displayName = 'OperatorHubTileView';
