import * as React from 'react';
import { CatalogItemHeader, CatalogTile } from '@patternfly/react-catalog-view-extension';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Truncate,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { getQueryArgument } from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils/router';
import { TileViewPage } from '@console/internal/components/utils/tile-view-page';
import i18n from '@console/internal/i18n';
import {
  GreenCheckCircleIcon,
  Modal,
  COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY as storeKey,
  COMMUNITY_PROVIDERS_WARNING_USERSETTINGS_KEY as userSettingsKey,
  useUserSettingsCompatibility,
} from '@console/shared';
import { getURLWithParams } from '@console/shared/src/components/catalog/utils';
import { isModifiedEvent } from '@console/shared/src/utils';
import { DefaultCatalogSource } from '../../const';
import { SubscriptionModel } from '../../models';
import { DeprecatedOperatorWarningBadge } from '../deprecated-operator-warnings/deprecated-operator-warnings';
import { communityOperatorWarningModal } from './operator-hub-community-provider-modal';
import { OperatorHubItemDetails } from './operator-hub-item-details';
import {
  capabilityLevelSort,
  infraFeaturesSort,
  installedStateSort,
  isAWSSTSCluster,
  isAzureWIFCluster,
  isGCPWIFCluster,
  providerSort,
  sourceSort,
  validSubscriptionSort,
} from './operator-hub-utils';
import { InfrastructureFeature, OperatorHubItem } from './index';

const osBaseLabel = 'operatorframework.io/os.';
const archBaseLabel = 'operatorframework.io/arch.';
const targetNodeOperatingSystems = window.SERVER_FLAGS.nodeOperatingSystems ?? [];
const targetNodeOperatingSystemsLabels = targetNodeOperatingSystems.map(
  (os) => `${osBaseLabel}${os}`,
);
const targetNodeArchitectures = window.SERVER_FLAGS.nodeArchitectures ?? [];
const targetNodeArchitecturesLabels = targetNodeArchitectures.map(
  (arch) => `${archBaseLabel}${arch}`,
);
// if no label present, these are the assumed defaults
const archDefaultAMD64Label = 'operatorframework.io/arch.amd64';
const osDefaultLinuxLabel = 'operatorframework.io/os.linux';
const filterByArchAndOS = (items: OperatorHubItem[]): OperatorHubItem[] => {
  if (_.isEmpty(targetNodeArchitectures) && _.isEmpty(targetNodeOperatingSystems)) {
    return items;
  }
  return items.filter((item: OperatorHubItem) => {
    // - if the operator has no flags, treat it with the defaults
    // - if it has any flags, it must list all flags (no defaults applied)
    const relevantLabels = _.reduce(
      item?.obj?.metadata?.labels ?? {},
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

    if (_.isEmpty(relevantLabels.arch)) {
      relevantLabels.arch.push(archDefaultAMD64Label);
    }

    return (
      _.some(relevantLabels.os, (os) => _.includes(targetNodeOperatingSystemsLabels, os)) &&
      _.some(relevantLabels.arch, (arch) => _.includes(targetNodeArchitecturesLabels, arch))
    );
  });
};

const Badge = ({ text }) => (
  <span key={text} className="pf-v6-c-badge pf-m-read">
    <Truncate className="pf-v6-c-truncate--no-min-width" content={text} />
  </span>
);

/**
 * Filter property allow list
 */
const operatorHubFilterGroups = [
  'source',
  'provider',
  'installState',
  'capabilityLevel',
  'infraFeatures',
  'validSubscriptionFilters',
];

const ignoredProviderTails = [', Inc.', ', Inc', ' Inc.', ' Inc', ', LLC', ' LLC'];

type Category = {
  id: string;
  label: string;
  field: 'categories';
  values: string[];
};

export const determineCategories = (items: OperatorHubItem[]): Record<string, Category> => {
  const newCategories: Record<string, Category> = {};
  _.each(items, (item) => {
    _.each(item.categories, (category) => {
      if (!newCategories[category] && category) {
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
    {} as Record<string, Category>,
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

const sortFilterValues = (values, field) => {
  let sorter: any = ['value'];

  if (field === 'provider') {
    sorter = ({ value }) => providerSort(value);
  }

  if (field === 'source') {
    return _.sortBy(values, [({ value }) => sourceSort(value), 'value']);
  }

  if (field === 'installState') {
    sorter = ({ value }) => installedStateSort(value);
  }

  if (field === 'capabilityLevel') {
    sorter = ({ value }) => capabilityLevelSort(value);
  }

  if (field === 'infraFeatures') {
    sorter = ({ value }) => infraFeaturesSort(value);
  }

  if (field === 'validSubscriptionFilters') {
    sorter = ({ value }) => validSubscriptionSort(value);
  }

  return _.sortBy(values, sorter);
};

const determineAvailableFilters = (initialFilters, items: OperatorHubItem[], filterGroups) => {
  const filters = _.cloneDeep(initialFilters);

  _.each(filterGroups, (field) => {
    const values = [];
    _.each(items, (item) => {
      let value = item[field];
      let synonyms;
      if (field === 'provider') {
        value = getProviderValue(value);
        synonyms = _.map(ignoredProviderTails, (tail) => `${value}${tail}`);
      }
      if (value !== undefined && !Array.isArray(value)) {
        if (!_.some(values, { value })) {
          values.push({
            label: value,
            synonyms,
            value,
            active: false,
          });
        }
      }

      if (Array.isArray(value)) {
        _.each(value, (v) => {
          if (!_.some(values, { v })) {
            values.push({
              label: v,
              synonyms,
              value: v,
              active: false,
            });
          }
        });
      }
    });

    _.forEach(sortFilterValues(values, field), (nextValue: any) =>
      _.set(filters, [field, nextValue.value], nextValue),
    );
  });

  // Always show both install state filters
  if (!filters.installState) {
    filters.installState = {
      Installed: {
        label: i18n.t('olm~Installed'),
        value: 'Installed',
        active: false,
      },
      'Not Installed': {
        label: i18n.t('olm~Not Installed'),
        value: 'Not Installed',
        active: false,
      },
    };
  } else {
    _.set(filters, 'installState.Installed.label', i18n.t('olm~Installed'));
    _.set(filters, 'installState.Not Installed.label', i18n.t('olm~Not Installed'));
  }

  return filters;
};

export const keywordCompare = (filterString, item) => {
  if (!filterString) {
    return true;
  }
  if (!item) {
    return false;
  }
  const keywords = item.keywords?.map((k) => k.toLowerCase()) ?? [];

  return (
    item.name.toLowerCase().includes(filterString) ||
    _.get(item, 'obj.metadata.name', '').toLowerCase().includes(filterString) ||
    (item.description && item.description.toLowerCase().includes(filterString)) ||
    keywords.includes(filterString)
  );
};

// Calculate relevance score for an operator based on search term matches
export const calculateRelevanceScore = (filterString, item) => {
  if (!filterString || !item) {
    return 0;
  }

  const searchTerm = filterString.toLowerCase();
  const keywords = item.keywords?.map((k) => k.toLowerCase()) ?? [];
  let score = 0;

  // Title/Name matches get highest weight
  if (item.name && typeof item.name === 'string') {
    const itemName = item.name.toLowerCase();
    if (itemName.includes(searchTerm)) {
      score += 100;
      // Exact title match gets bonus points
      if (itemName === searchTerm) {
        score += 50;
      }
      // Title starts with search term gets bonus points
      if (itemName.startsWith(searchTerm)) {
        score += 25;
      }
    }
  }

  // Metadata name matches get high weight
  const metadataName = _.get(item, 'obj.metadata.name', '');
  if (metadataName && typeof metadataName === 'string') {
    const metadataNameLower = metadataName.toLowerCase();
    if (metadataNameLower.includes(searchTerm)) {
      score += 80;
      if (metadataNameLower === searchTerm) {
        score += 40;
      }
      if (metadataNameLower.startsWith(searchTerm)) {
        score += 20;
      }
    }
  }

  // Keywords matches get medium weight
  if (keywords.includes(searchTerm)) {
    score += 60;
  }

  // Description matches get lowest weight
  if (item.description && typeof item.description === 'string') {
    const descriptionLower = item.description.toLowerCase();
    if (descriptionLower.includes(searchTerm)) {
      score += 20;
      // Description starts with search term gets small bonus
      if (descriptionLower.startsWith(searchTerm)) {
        score += 5;
      }
    }
  }

  return score;
};

export const keywordCompareWithScore = (filterString, item) => {
  const score = calculateRelevanceScore(filterString, item);
  return {
    matches: score > 0,
    score,
    item: { ...item, relevanceScore: score },
  };
};

// Flag to indicate this function uses scoring
keywordCompareWithScore.useScoring = true;

const setURLParams = (params) => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

const isRedHatProvider = (item) => {
  if (!item) return false;

  if (item.provider && item.provider.toLowerCase().includes('red hat')) {
    return true;
  }

  const metadataProvider = _.get(item, 'obj.metadata.labels.provider', '');
  if (metadataProvider && metadataProvider.toLowerCase().includes('red hat')) {
    return true;
  }

  return false;
};

export const orderAndSortByRelevance = (items, searchTerm = '') => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  // If there's a search term, sort by relevance score first
  if (searchTerm) {
    const itemsWithScores = items
      .filter((item) => item != null) // Filter out null/undefined items
      .map((item) => ({
        ...item,
        relevanceScore: calculateRelevanceScore(searchTerm, item),
      }));

    return itemsWithScores.sort((a, b) => {
      const aIsRedHat = isRedHatProvider(a);
      const bIsRedHat = isRedHatProvider(b);
      const scoreDiff = Math.abs(b.relevanceScore - a.relevanceScore);

      // For operators with similar relevance scores (within 100 points),
      // prioritize Red Hat first to ensure consistent ordering
      // This covers cases where both have title matches but slight scoring differences
      if (scoreDiff <= 100) {
        if (aIsRedHat && !bIsRedHat) return -1;
        if (!aIsRedHat && bIsRedHat) return 1;
      }

      // Primary sort by relevance score (descending)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Secondary sort by provider (Red Hat first) when scores are exactly equal
      if (aIsRedHat && !bIsRedHat) return -1;
      if (!aIsRedHat && bIsRedHat) return 1;

      // Name (alphabetical)
      return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    });
  }

  // No search term - use original sorting logic
  const redHatItems = items
    .filter((item) => item != null && isRedHatProvider(item))
    .sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));

  const nonRedHatItems = items
    .filter((item) => item != null && !isRedHatProvider(item))
    .sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));

  return [...redHatItems, ...nonRedHatItems];
};

const OperatorHubTile: React.FC<OperatorHubTileProps> = ({ item, onClick }) => {
  const { t } = useTranslation();
  if (!item) {
    return null;
  }
  const { uid, name, imgUrl, provider, description, installed } = item;
  const vendor = provider ? t('olm~provided by {{provider}}', { provider }) : null;
  const badges = item?.source ? [<Badge text={item.source} />] : [];
  const icon = <img className="co-catalog--logo" loading="lazy" src={imgUrl} alt="" />;
  const vendorAndDeprecated = () => (
    <>
      {vendor}
      {item?.obj?.status?.deprecation && (
        <div>
          <DeprecatedOperatorWarningBadge
            className="pf-v6-u-mt-xs"
            deprecation={item.obj.status.deprecation}
          />
        </div>
      )}
    </>
  );

  return (
    <CatalogTile
      className="co-catalog-tile"
      key={uid}
      id={uid}
      title={name}
      badges={badges}
      icon={icon}
      vendor={vendorAndDeprecated()}
      description={description}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        if (isModifiedEvent(e)) return;
        e.preventDefault();
        onClick(item);
      }}
      href={getURLWithParams('details-item', item.uid)}
      footer={
        installed && !item.isInstalling ? (
          <span>
            <GreenCheckCircleIcon /> {t('olm~Installed')}
          </span>
        ) : null
      }
      data-test={uid}
    />
  );
};

export const OperatorHubTileView: React.FC<OperatorHubTileViewProps> = (props) => {
  const { t } = useTranslation();
  const [detailsItem, setDetailsItem] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [ignoreOperatorWarning, setIgnoreOperatorWarning, loaded] = useUserSettingsCompatibility<
    boolean
  >(userSettingsKey, storeKey, false);
  const [updateChannel, setUpdateChannel] = React.useState('');
  const [updateVersion, setUpdateVersion] = React.useState('');
  const [tokenizedAuth, setTokenizedAuth] = React.useState(null);
  const installVersion = getQueryArgument('version');
  const filteredItems = filterByArchAndOS(props.items);

  React.useEffect(() => {
    const detailsItemID = new URLSearchParams(window.location.search).get('details-item');
    const currentItem = _.find(filteredItems, {
      uid: detailsItemID,
    });
    setDetailsItem(currentItem);
    setShowDetails(!_.isNil(currentItem));
    if (
      currentItem &&
      isAWSSTSCluster(
        currentItem.cloudCredentials,
        currentItem.infrastructure,
        currentItem.authentication,
      ) &&
      currentItem.infraFeatures?.find((i) => i === InfrastructureFeature.TokenAuth)
    ) {
      setTokenizedAuth('AWS');
    }
    if (
      currentItem &&
      isAzureWIFCluster(
        currentItem.cloudCredentials,
        currentItem.infrastructure,
        currentItem.authentication,
      ) &&
      currentItem.infraFeatures?.find((i) => i === InfrastructureFeature.TokenAuth)
    ) {
      setTokenizedAuth('Azure');
    }
    if (
      currentItem &&
      isGCPWIFCluster(
        currentItem.cloudCredentials,
        currentItem.infrastructure,
        currentItem.authentication,
      ) &&
      currentItem.infraFeatures?.find((i) => i === InfrastructureFeature.TokenAuthGCP)
    ) {
      setTokenizedAuth('GCP');
    }
  }, [filteredItems]);

  const showCommunityOperator = (item: OperatorHubItem) => (ignoreWarning = false) => {
    const params = new URLSearchParams(window.location.search);
    params.set('details-item', item.uid);
    setURLParams(params);
    setDetailsItem(item);
    setShowDetails(true);

    if (loaded && ignoreWarning) {
      setIgnoreOperatorWarning(true);
    }
  };

  const closeOverlay = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('details-item');
    params.delete('channel');
    params.delete('version');
    setURLParams(params);
    setDetailsItem(null);
    setShowDetails(false);
    // reset version and channel state so that switching between operator cards does not carry over previous selections
    setUpdateChannel('');
    setUpdateVersion('');
    setTokenizedAuth('');
  };

  const openOverlay = (item: OperatorHubItem) => {
    if (!ignoreOperatorWarning && item.catalogSource === DefaultCatalogSource.CommunityOperators) {
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

  const renderTile = (item: OperatorHubItem) => (
    <OperatorHubTile updateChannel={updateChannel} item={item} onClick={openOverlay} />
  );

  const installParamsURL =
    detailsItem &&
    detailsItem.obj &&
    new URLSearchParams({
      pkg: detailsItem.obj.metadata.name,
      catalog: detailsItem.catalogSource,
      catalogNamespace: detailsItem.catalogSourceNamespace,
      targetNamespace: props.namespace,
      channel: updateChannel,
      version: updateVersion,
      tokenizedAuth,
    }).toString();

  const installLink =
    detailsItem && detailsItem.obj && `/operatorhub/subscribe?${installParamsURL.toString()}`;

  const uninstallLink = () =>
    detailsItem &&
    detailsItem.subscription &&
    `/k8s/ns/${detailsItem.subscription.metadata.namespace}/${SubscriptionModel.plural}/${detailsItem.subscription.metadata.name}?showDelete=true`;

  if (_.isEmpty(filteredItems)) {
    return (
      <>
        <EmptyState
          headingLevel="h5"
          titleText={<>{t('olm~No Operators available')}</>}
          variant={EmptyStateVariant.full}
          className="co-status-card__alerts-msg"
        >
          <EmptyStateFooter>
            {window.SERVER_FLAGS.GOOS && window.SERVER_FLAGS.GOARCH && (
              <EmptyStateBody>
                {t(
                  'olm~There are no Operators that match operating system {{os}} and architecture {{arch}}.',
                  {
                    os: window.SERVER_FLAGS.GOOS,
                    arch: window.SERVER_FLAGS.GOARCH,
                  },
                )}
              </EmptyStateBody>
            )}
          </EmptyStateFooter>
        </EmptyState>
      </>
    );
  }

  const filterGroupNameMap = {
    source: t('olm~Source'),
    provider: t('olm~Provider'),
    installState: t('olm~Install state'),
    capabilityLevel: t('olm~Capability level'),
    infraFeatures: t('olm~Infrastructure features'),
    validSubscriptionFilters: t('olm~Valid subscription'),
  };

  const titleAndDeprecatedPackage = () => (
    <>
      {detailsItem.name}
      {detailsItem?.obj?.status?.deprecation && (
        <DeprecatedOperatorWarningBadge
          className="pf-v6-u-ml-sm"
          deprecation={detailsItem.obj.status.deprecation}
        />
      )}
    </>
  );
  return (
    <>
      <TileViewPage
        items={filteredItems}
        itemsSorter={orderAndSortByRelevance}
        getAvailableCategories={determineCategories}
        getAvailableFilters={determineAvailableFilters}
        filterGroups={operatorHubFilterGroups}
        filterGroupNameMap={filterGroupNameMap}
        keywordCompare={keywordCompareWithScore}
        renderTile={renderTile}
        emptyStateTitle={t('olm~No Results Match the Filter Criteria')}
        emptyStateInfo={t(
          'olm~No OperatorHub items are being shown due to the filters being applied.',
        )}
      />
      {detailsItem && (
        <Modal
          className="co-catalog-page__overlay co-catalog-page__overlay--right"
          data-test-id="operator-modal-box"
          aria-labelledby="catalog-item-header"
          isOpen={!!detailsItem && showDetails}
          onClose={closeOverlay}
          title={detailsItem.name}
          header={
            <>
              <CatalogItemHeader
                className="co-catalog-page__overlay-header"
                iconClass={detailsItem.iconClass}
                iconImg={detailsItem.imgUrl}
                title={titleAndDeprecatedPackage()}
                vendor={t('olm~{{version}} provided by {{provider}}', {
                  version: updateVersion || installVersion || detailsItem.version,
                  provider: detailsItem.provider,
                })}
                data-test-id="operator-modal-header"
                id="catalog-item-header"
              />

              <div className="co-catalog-page__overlay-actions">
                {!detailsItem.installed ? (
                  <Link
                    className={css(
                      'pf-v6-c-button',
                      'pf-m-primary',
                      {
                        'pf-m-disabled': !detailsItem.obj || detailsItem.isInstalling,
                      },
                      'co-catalog-page__overlay-action',
                    )}
                    data-test-id="operator-install-btn"
                    to={installLink}
                  >
                    {t('olm~Install')}
                  </Link>
                ) : (
                  <Button
                    className="co-catalog-page__overlay-action"
                    data-test-id="operator-uninstall-btn"
                    isDisabled={!detailsItem.installed}
                    onClick={() => history.push(uninstallLink())}
                    variant="secondary"
                  >
                    {t('olm~Uninstall')}
                  </Button>
                )}
              </div>
            </>
          }
        >
          <OperatorHubItemDetails
            item={detailsItem}
            updateChannel={updateChannel}
            setUpdateChannel={setUpdateChannel}
            updateVersion={updateVersion}
            setUpdateVersion={setUpdateVersion}
          />
        </Modal>
      )}
    </>
  );
};

type OperatorHubTileProps = {
  item: OperatorHubItem;
  onClick: (item: OperatorHubItem) => void;
  updateChannel: string;
};

export type OperatorHubTileViewProps = {
  namespace?: string;
  items: OperatorHubItem[];
};

OperatorHubTileView.displayName = 'OperatorHubTileView';
