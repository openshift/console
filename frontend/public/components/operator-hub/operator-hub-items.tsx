/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Button, Icon, Modal } from 'patternfly-react';
import { CatalogTile, FilterSidePanel } from 'patternfly-react-extensions';

import { history } from '../utils/router';
import { COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY } from '../../const';
import { K8sResourceKind } from '../../module/k8s';
import { requireOperatorGroup } from '../operator-lifecycle-manager/operator-group';
import { normalizeIconClass } from '../catalog/catalog-item-icon';
import { TileViewPage, updateURLParams, getFilterSearchParam, updateActiveFilters } from '../utils/tile-view-page';
import { OperatorHubItemDetails } from './operator-hub-item-details';
import { OperatorHubCommunityProviderModal } from './operator-hub-community-provider-modal';

const pageDescription = (
  <span>
    Discover Operators from the Kubernetes community and Red Hat partners, curated by Red Hat.
    Operators can be installed on your clusters to provide optional add-ons and shared services to your developers.
    Once installed, the capabilities provided by the Operator appear in the <a href="/catalog">Developer Catalog</a>,
    providing a self-service experience.
  </span>
);
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
    (item.description && item.description.toLowerCase().includes(filterString)) ||
    (item.tags && item.tags.includes(filterString));
};

const setURLParams = params => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export const OperatorHubTileView = requireOperatorGroup(
  // TODO: Can be functional stateless component
  class OperatorHubTileView extends React.Component<OperatorHubTileViewProps, OperatorHubTileViewState> {
    constructor(props) {
      super(props);

      this.state = {
        detailsItem: null,
        items: props.items,
        communityOperatorsExist: false,
        includeCommunityOperators: false,
        communityModalShown: false,
      };

      this.openOverlay = this.openOverlay.bind(this);
      this.closeOverlay = this.closeOverlay.bind(this);
      this.renderFilterGroup = this.renderFilterGroup.bind(this);
      this.renderTile = this.renderTile.bind(this);
    }

    componentDidMount() {
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

      if (!_.isEqual(items, prevProps.items) || includeCommunityOperators !== prevState.includeCommunityOperators) {
        const communityOperatorsExist = _.some(items, item => item.providerType === COMMUNITY_PROVIDER_TYPE);
        let stateItems = items;
        if (communityOperatorsExist && !includeCommunityOperators) {
          stateItems = _.filter(items, item => item.providerType !== COMMUNITY_PROVIDER_TYPE);
        }
        this.setState({items: stateItems, communityOperatorsExist});
      }
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

    onIncludeCommunityOperatorsToggle = (activeFilters, onUpdateFilters) => {
      const {items} = this.props;
      const {includeCommunityOperators} = this.state;

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
        updateURLParams('providerType', getFilterSearchParam(groupFilter));
        updatedFilters = updateActiveFilters(activeFilters, 'providerType', COMMUNITY_PROVIDER_TYPE, false);
        onUpdateFilters(updatedFilters);
      }

      this.setState({items: stateItems, includeCommunityOperators: false});
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

    renderFilterGroup(filterGroup, groupName, activeFilters, filterCounts, onFilterChange, onUpdateFilters) {
      const { includeCommunityOperators, communityOperatorsExist } = this.state;
      return <FilterSidePanel.Category
        key={groupName}
        title={operatorHubFilterMap[groupName] || groupName}
      >
        {_.map(filterGroup, (filter, filterName) => {
          const { label, active } = filter;
          return <FilterSidePanel.CategoryItem
            key={filterName}
            count={_.get(filterCounts, [groupName, filterName], 0)}
            checked={active}
            onChange={e => onFilterChange(groupName, filterName, e.target.checked)}
            title={label}
          >
            {label}
          </FilterSidePanel.CategoryItem>;
        })}
        {groupName === 'providerType' && communityOperatorsExist && (
          <Button bsStyle="link" className="co-catalog-page__filter-toggle" onClick={() => this.onIncludeCommunityOperatorsToggle(activeFilters, onUpdateFilters)}>
            {includeCommunityOperators ? 'Hide Community Operators' : 'Show Community Operators'}
          </Button>
        )}
      </FilterSidePanel.Category>;
    }

    renderTile(item) {
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
    }

    render() {
      const { items, detailsItem, communityModalShown } = this.state;

      return <React.Fragment>
        <TileViewPage
          items={items}
          itemsSorter={(itemsToSort) => _.sortBy(itemsToSort, 'name')}
          getAvailableCategories={determineCategories}
          getAvailableFilters={determineAvailableFilters}
          filterGroups={operatorHubFilterGroups}
          renderFilterGroup={this.renderFilterGroup}
          keywordCompare={keywordCompare}
          renderTile={this.renderTile}
          pageDescription={pageDescription}
          emptyStateInfo="No Operator Hub items are being shown due to the filters being applied."
        />
        <Modal show={!!detailsItem} onHide={this.closeOverlay} bsSize={'lg'} className="co-catalog-page__overlay right-side-modal-pf">
          {detailsItem && <OperatorHubItemDetails item={detailsItem} closeOverlay={this.closeOverlay} />}
        </Modal>
        <OperatorHubCommunityProviderModal show={communityModalShown} close={this.showCommunityOperators} />
      </React.Fragment>;
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
  items: any[];
  communityOperatorsExist: boolean;
  includeCommunityOperators: boolean;
  communityModalShown: boolean;
};

OperatorHubTileView.displayName = 'OperatorHubTileView';
