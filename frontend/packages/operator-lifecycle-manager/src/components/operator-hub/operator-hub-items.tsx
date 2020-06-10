import * as React from 'react';
import * as _ from 'lodash';
import LazyLoad from 'react-lazyload';
import { Modal } from 'patternfly-react';
import { CatalogTile } from 'patternfly-react-extensions';
import { EmptyState, EmptyStateBody, EmptyStateVariant, Title } from '@patternfly/react-core';
import { GreenCheckCircleIcon } from '@console/shared';
import { history } from '@console/internal/components/utils/router';
import { COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY } from '@console/internal/const';
import { TileViewPage } from '@console/internal/components/utils/tile-view-page';
import * as operatorLogo from '@console/internal/imgs/operator.svg';
import { OperatorHubItemDetails } from './operator-hub-item-details';
import { communityOperatorWarningModal } from './operator-hub-community-provider-modal';
import { OperatorHubItem, InstalledState, ProviderType, CapabilityLevel } from './index';

const osBaseLabel = 'operatorframework.io/os.';
const targetGOOSLabel = window.SERVER_FLAGS.GOOS ? `${osBaseLabel}${window.SERVER_FLAGS.GOOS}` : '';
const archBaseLabel = 'operatorframework.io/arch.';
const targetGOARCHLabel = window.SERVER_FLAGS.GOARCH
  ? `${archBaseLabel}${window.SERVER_FLAGS.GOARCH}`
  : '';
// if no label present, these are the assumed defaults
const archDefaultAMD64Label = 'operatorframework.io/arch.amd64';
const osDefaultLinuxLabel = 'operatorframework.io/os.linux';
const filterByArchAndOS = (items: OperatorHubItem[]): OperatorHubItem[] => {
  if (!window.SERVER_FLAGS.GOARCH || !window.SERVER_FLAGS.GOOS) {
    return items;
  }
  return items.filter((item: OperatorHubItem) => {
    // - if the operator has no flags, treat it with the defaults
    // - if it has any flags, it must list all flags (no defaults applied)
    const relevantLabels = _.reduce(
      _.get(item, 'obj.metadata.labels', []),
      (result, value: string, label: string): { arch: string[]; os: string[] } => {
        if (label.includes(archBaseLabel) && value === 'supported') {
          result.arch.push(label);
        }
        if (label.includes(osBaseLabel) && value === 'supported') {
          result.os.push(label);
        }
        return result;
      },
      {
        arch: [],
        os: [],
      },
    );

    if (_.isEmpty(relevantLabels.os)) {
      relevantLabels.os.push(osDefaultLinuxLabel);
    }

    if (_.isEmpty(relevantLabels.os)) {
      relevantLabels.arch.push(archDefaultAMD64Label);
    }

    return (
      _.includes(relevantLabels.os, targetGOOSLabel) &&
      _.includes(relevantLabels.arch, targetGOARCHLabel)
    );
  });
};

const badge = (text: string) => (
  <span key="1" className="pf-c-badge pf-m-read">
    {text}
  </span>
);

/**
 * Filter property white list
 */
const operatorHubFilterGroups = ['providerType', 'provider', 'installState', 'capabilityLevel'];

const operatorHubFilterMap = {
  providerType: 'Provider Type',
  installState: 'Install State',
  capabilityLevel: 'Capability Level',
};

const COMMUNITY_PROVIDER_TYPE = 'Community';
const CUSTOM_PROVIDER_TYPE = 'Custom';

const ignoredProviderTails = [', Inc.', ', Inc', ' Inc.', ' Inc', ', LLC', ' LLC'];

const determineCategories = (items) => {
  const newCategories = {};
  _.each(items, (item) => {
    _.each(item.categories, (category) => {
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

  const sortedKeys = _.keys(newCategories).sort((key1, key2) =>
    key1.toLowerCase().localeCompare(key2.toLowerCase()),
  );

  return _.reduce(
    sortedKeys,
    (categories, key) => {
      categories[key] = newCategories[key];
      return categories;
    },
    {},
  );
};

export const getProviderValue = (value) => {
  if (!value) {
    return value;
  }

  const providerTail = _.find(ignoredProviderTails, (tail) => value.endsWith(tail));
  if (providerTail) {
    return value.substring(0, value.indexOf(providerTail));
  }

  return value;
};

const providerSort = (provider) => {
  if (provider.value.toLowerCase() === 'red hat') {
    return '';
  }
  return provider.value;
};

const providerTypeSort = (provider) => {
  switch (provider.value) {
    case ProviderType.RedHat:
      return 0;
    case ProviderType.Certified:
      return 1;
    case ProviderType.Community:
      return 2;
    case ProviderType.Custom:
      return 4;
    default:
      return 5;
  }
};

const installedStateSort = (provider) => {
  switch (provider.value) {
    case InstalledState.Installed:
      return 0;
    case InstalledState.NotInstalled:
      return 1;
    default:
      return 3;
  }
};

const capabilityLevelSort = (provider) => {
  switch (provider.value) {
    case CapabilityLevel.BasicInstall:
      return 0;
    case CapabilityLevel.SeamlessUpgrades:
      return 1;
    case CapabilityLevel.FullLifecycle:
      return 2;
    case CapabilityLevel.DeepInsights:
      return 3;
    default:
      return 5;
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

  if (field === 'capabilityLevel') {
    sorter = capabilityLevelSort;
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

  _.each(filterGroups, (field) => {
    const values = [];
    _.each(items, (item) => {
      let value = item[field];
      let synonyms;
      if (field === 'provider') {
        value = getProviderValue(value);
        synonyms = _.map(ignoredProviderTails, (tail) => `${value}${tail}`);
      }
      if (value !== undefined) {
        if (!_.some(values, { value })) {
          values.push({
            label: value,
            synonyms,
            value,
            active: false,
          });
        }
      }
    });

    _.forEach(sortFilterValues(values, field), (nextValue: any) =>
      _.set(filters, [field, nextValue.value], nextValue),
    );
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

  return (
    item.name.toLowerCase().includes(filterString) ||
    _.get(item, 'obj.metadata.name', '')
      .toLowerCase()
      .includes(filterString) ||
    (item.description && item.description.toLowerCase().includes(filterString)) ||
    (item.tags && item.tags.includes(filterString))
  );
};

const setURLParams = (params) => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export const OperatorHubTileView: React.FC<OperatorHubTileViewProps> = (props) => {
  const [detailsItem, setDetailsItem] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);

  const filteredItems = filterByArchAndOS(props.items);

  React.useEffect(() => {
    const detailsItemID = new URLSearchParams(window.location.search).get('details-item');
    const currentItem = _.find(filteredItems, { uid: detailsItemID });
    setDetailsItem(currentItem);
    setShowDetails(!_.isNil(currentItem));
  }, [filteredItems]);

  const showCommunityOperator = (item: OperatorHubItem) => (ignoreWarning = false) => {
    const params = new URLSearchParams(window.location.search);
    params.set('details-item', item.uid);
    setURLParams(params);
    setDetailsItem(item);
    setShowDetails(true);

    if (ignoreWarning) {
      localStorage.setItem(COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY, 'true');
    }
  };

  const openOverlay = (item: OperatorHubItem) => {
    const ignoreWarning =
      localStorage.getItem(COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY) === 'true';

    if (!ignoreWarning && item.providerType === COMMUNITY_PROVIDER_TYPE) {
      communityOperatorWarningModal({
        showCommunityOperators: (ignore) => showCommunityOperator(item)(ignore),
      });
    } else {
      const params = new URLSearchParams(window.location.search);
      params.set('details-item', item.uid);
      setURLParams(params);
      setDetailsItem(item);
      setShowDetails(true);
    }
  };

  const closeOverlay = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('details-item');
    setURLParams(params);
    setDetailsItem(null);
    setShowDetails(false);
  };

  const renderTile = (item: OperatorHubItem) => {
    if (!item) {
      return null;
    }

    const { uid, name, imgUrl, provider, description, installed } = item;
    const vendor = provider ? `provided by ${provider}` : null;
    const badges = [COMMUNITY_PROVIDER_TYPE, CUSTOM_PROVIDER_TYPE].includes(item.providerType)
      ? [badge(item.providerType)]
      : [];
    const icon = (
      <LazyLoad
        offset={1000}
        once
        placeholder={<img className="catalog-tile-pf-icon" src={operatorLogo} alt="" />}
        scrollContainer="#content-scrollable"
      >
        <img className="catalog-tile-pf-icon" src={imgUrl} alt="" />
      </LazyLoad>
    );
    return (
      <CatalogTile
        key={uid}
        title={name}
        badges={badges}
        icon={icon}
        vendor={vendor}
        description={description}
        onClick={() => openOverlay(item)}
        footer={
          installed ? (
            <span>
              <GreenCheckCircleIcon /> Installed
            </span>
          ) : null
        }
        data-test={uid}
      />
    );
  };

  if (_.isEmpty(filteredItems)) {
    return (
      <>
        <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
          <Title headingLevel="h5" size="lg">
            No operators available
          </Title>
          {window.SERVER_FLAGS.GOOS && window.SERVER_FLAGS.GOARCH && (
            <EmptyStateBody>
              There are no operators that match operating system {window.SERVER_FLAGS.GOOS} and
              architecture {window.SERVER_FLAGS.GOARCH}.
            </EmptyStateBody>
          )}
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <TileViewPage
        items={filteredItems}
        itemsSorter={(itemsToSort) => _.sortBy(itemsToSort, ({ name }) => name.toLowerCase())}
        getAvailableCategories={determineCategories}
        getAvailableFilters={determineAvailableFilters}
        filterGroups={operatorHubFilterGroups}
        filterGroupNameMap={operatorHubFilterMap}
        keywordCompare={keywordCompare}
        renderTile={renderTile}
        emptyStateInfo="No OperatorHub items are being shown due to the filters being applied."
      />
      <Modal
        show={!!detailsItem && showDetails}
        onHide={closeOverlay}
        bsSize="lg"
        className="co-catalog-page__overlay right-side-modal-pf"
      >
        {detailsItem && (
          <OperatorHubItemDetails
            namespace={props.namespace}
            item={detailsItem}
            closeOverlay={closeOverlay}
          />
        )}
      </Modal>
    </>
  );
};

export type OperatorHubTileViewProps = {
  namespace?: string;
  items: OperatorHubItem[];
};

OperatorHubTileView.displayName = 'OperatorHubTileView';
