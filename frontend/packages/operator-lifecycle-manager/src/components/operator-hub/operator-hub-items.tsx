import type { FC, MouseEvent } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Link, useSearchParams } from 'react-router-dom-v5-compat';
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
import { InfrastructureFeature, OperatorHubItem, TokenizedAuthProvider } from './index';

// Scoring and priority code no longer used and will be removed with Operator Hub catalog files cleanup effort
const SCORE = {
  // Title/Name matches (highest priority)
  TITLE_CONTAINS: 100,
  TITLE_EXACT_BONUS: 50,
  TITLE_STARTS_BONUS: 25,

  // Metadata name matches (high priority)
  METADATA_CONTAINS: 80,
  METADATA_EXACT_BONUS: 40,
  METADATA_STARTS_BONUS: 20,

  // Keyword matches (medium priority)
  KEYWORD_MATCH: 60,

  // Description matches (low priority)
  DESCRIPTION_CONTAINS: 20,
  DESCRIPTION_STARTS_BONUS: 5,
} as const;

// Red Hat priority constants
const REDHAT_PRIORITY = {
  EXACT_MATCH: 2,
  CONTAINS_REDHAT: 1,
  NON_REDHAT: 0,
} as const;

// Sorting thresholds
const SORTING_THRESHOLDS = {
  REDHAT_PRIORITY_DELTA: 100, // Score difference threshold for Red Hat prioritization
} as const;

// Performance optimization types for precomputed scoring
type ScoringData = {
  relevanceScore: number;
  redHatPriority: number;
  nameLower: string;
};

type ItemWithScoring = OperatorHubItem & {
  _scoringData: ScoringData;
};

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

const Badge: FC<{ text: string }> = ({ text }) => (
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

export const getProviderValue = (value: string): string => {
  if (!value) {
    return value;
  }

  const providerTail = _.find(ignoredProviderTails, (tail) => value.endsWith(tail));
  if (providerTail) {
    return value.substring(0, value.indexOf(providerTail));
  }

  return value;
};

const sortFilterValues = (values: any[], field: string): any[] => {
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

const determineAvailableFilters = (
  initialFilters: any,
  items: OperatorHubItem[],
  filterGroups: string[],
): any => {
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

export const keywordCompare = (filterString: string, item: OperatorHubItem): boolean => {
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
export const calculateRelevanceScore = (filterString: string, item: OperatorHubItem): number => {
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
      score += SCORE.TITLE_CONTAINS;
      // Exact title match gets bonus points
      if (itemName === searchTerm) {
        score += SCORE.TITLE_EXACT_BONUS;
      }
      // Title starts with search term gets bonus points
      if (itemName.startsWith(searchTerm)) {
        score += SCORE.TITLE_STARTS_BONUS;
      }
    }
  }

  // Metadata name matches get high weight
  const metadataName = item?.obj?.metadata?.name ?? '';
  if (metadataName && typeof metadataName === 'string') {
    const metadataNameLower = metadataName.toLowerCase();
    if (metadataNameLower.includes(searchTerm)) {
      score += SCORE.METADATA_CONTAINS;
      if (metadataNameLower === searchTerm) {
        score += SCORE.METADATA_EXACT_BONUS;
      }
      if (metadataNameLower.startsWith(searchTerm)) {
        score += SCORE.METADATA_STARTS_BONUS;
      }
    }
  }

  // Keywords matches get medium weight
  if (keywords.includes(searchTerm)) {
    score += SCORE.KEYWORD_MATCH;
  }

  // Description matches get lowest weight
  if (item.description && typeof item.description === 'string') {
    const descriptionLower = item.description.toLowerCase();
    if (descriptionLower.includes(searchTerm)) {
      score += SCORE.DESCRIPTION_CONTAINS;
      // Description starts with search term gets small bonus
      if (descriptionLower.startsWith(searchTerm)) {
        score += SCORE.DESCRIPTION_STARTS_BONUS;
      }
    }
  }

  return score;
};

type KeywordCompareResult = {
  matches: boolean;
  score: number;
  item: OperatorHubItem & { relevanceScore: number };
};

export const keywordCompareWithScore = (
  filterString: string,
  item: OperatorHubItem,
): KeywordCompareResult => {
  const score = calculateRelevanceScore(filterString, item);
  return {
    matches: score > 0,
    score,
    item: { ...item, relevanceScore: score },
  };
};

// Flag to indicate this function uses scoring
keywordCompareWithScore.useScoring = true;

const setURLParams = (params: URLSearchParams): void => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

const getRedHatPriority = (item: OperatorHubItem): number => {
  // Check metadata.labels.provider
  const metadataProvider = _.get(item, 'obj.metadata.labels.provider', '');
  if (metadataProvider) {
    const provider = metadataProvider.toLowerCase();
    if (/^red hat(,?\s?inc\.?)?$/.test(provider)) {
      return REDHAT_PRIORITY.EXACT_MATCH; // Highest priority for exact matches of 'red hat', 'red hat, inc.', 'red hat inc.', 'red hat inc'
    }
    if (provider.includes('red hat')) {
      return REDHAT_PRIORITY.CONTAINS_REDHAT; // Medium priority for contains 'red hat'
    }
  }

  return REDHAT_PRIORITY.NON_REDHAT; // Not Red Hat
};

// Performance optimization: Precompute all scoring data upfront
const precomputeItemScoring = (items: OperatorHubItem[], searchTerm = ''): ItemWithScoring[] => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item != null)
    .map((item) => ({
      ...item,
      _scoringData: {
        relevanceScore: searchTerm ? calculateRelevanceScore(searchTerm, item) : 0,
        redHatPriority: getRedHatPriority(item),
        nameLower: (item.name || '').toLowerCase(),
      },
    }));
};

// Performance optimization: Sort using only precomputed numbers (no function calls)
const sortPrecomputedItems = (
  itemsWithScoring: ItemWithScoring[],
  hasSearchTerm: boolean,
): ItemWithScoring[] => {
  return itemsWithScoring.sort((a, b) => {
    // eslint-disable-next-line no-underscore-dangle
    const aScoring = a._scoringData;
    // eslint-disable-next-line no-underscore-dangle
    const bScoring = b._scoringData;

    if (hasSearchTerm) {
      // Search term sorting logic
      const scoreDiff = Math.abs(bScoring.relevanceScore - aScoring.relevanceScore);

      // For operators with similar relevance scores (within 100 points threshold),
      // prioritize Red Hat first to ensure consistent ordering
      if (scoreDiff <= SORTING_THRESHOLDS.REDHAT_PRIORITY_DELTA) {
        if (aScoring.redHatPriority !== bScoring.redHatPriority) {
          return bScoring.redHatPriority - aScoring.redHatPriority;
        }
      }

      // Primary sort by relevance score (descending)
      if (bScoring.relevanceScore !== aScoring.relevanceScore) {
        return bScoring.relevanceScore - aScoring.relevanceScore;
      }

      // Secondary sort by Red Hat priority when scores are exactly equal
      if (aScoring.redHatPriority !== bScoring.redHatPriority) {
        return bScoring.redHatPriority - aScoring.redHatPriority;
      }

      // Tertiary sort by name (alphabetical)
      return aScoring.nameLower.localeCompare(bScoring.nameLower);
    }

    // No search term - use priority-based sorting logic
    // Primary sort by Red Hat priority (2 = exact match, 1 = contains, 0 = not Red Hat)
    if (aScoring.redHatPriority !== bScoring.redHatPriority) {
      return bScoring.redHatPriority - aScoring.redHatPriority;
    }

    // Secondary sort by name (alphabetical)
    return aScoring.nameLower.localeCompare(bScoring.nameLower);
  });
};

export const orderAndSortByRelevance = (
  items: OperatorHubItem[],
  searchTerm: string = '',
): OperatorHubItem[] => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  // Use precomputed scoring for performance optimization
  const itemsWithScoring = precomputeItemScoring(items, searchTerm);
  const sortedItems = sortPrecomputedItems(itemsWithScoring, !!searchTerm);

  // Return items without the internal _scoringData field but preserve relevanceScore for debugging
  return sortedItems.map((item) => {
    // eslint-disable-next-line no-underscore-dangle
    const { _scoringData, ...itemWithoutScoring } = item;
    return {
      ...itemWithoutScoring,
      // Preserve relevanceScore for console table debugging
      // eslint-disable-next-line no-underscore-dangle
      relevanceScore: _scoringData.relevanceScore,
    };
  });
};

const OperatorHubTile: FC<OperatorHubTileProps> = ({ item, onClick }) => {
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
      onClick={(e: MouseEvent<HTMLElement>) => {
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

export const OperatorHubTileView: FC<OperatorHubTileViewProps> = (props) => {
  const { t } = useTranslation();
  const [detailsItem, setDetailsItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [ignoreOperatorWarning, setIgnoreOperatorWarning, loaded] = useUserSettingsCompatibility<
    boolean
  >(userSettingsKey, storeKey, false);
  const [updateChannel, setUpdateChannel] = useState('');
  const [updateVersion, setUpdateVersion] = useState('');
  const [tokenizedAuth, setTokenizedAuth] = useState<TokenizedAuthProvider | undefined>(undefined);
  const installVersion = getQueryArgument('version');
  const filteredItems = filterByArchAndOS(props.items);

  // Use useSearchParams to reactively get URL parameters that update on URL changes
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('keyword');
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedSource = searchParams.get('source') || 'all';
  const selectedProvider = searchParams.get('provider') || 'all';
  const selectedCapabilityLevel = searchParams.get('capabilityLevel') || 'all';
  const selectedInfraFeatures = searchParams.get('infraFeatures') || 'all';
  const selectedValidSubscriptionFilters = searchParams.get('validSubscriptionFilters') || 'all';

  // Create wrapper functions that always use the full unfiltered item list
  // This ensures all categories and filter options are always available, regardless of current filters
  const getAvailableCategoriesFromAllItems = useCallback(() => {
    return determineCategories(filteredItems);
  }, [filteredItems]);

  const getAvailableFiltersFromAllItems = useCallback(
    (initialFilters: any, _items: OperatorHubItem[], filterGroups: string[]) => {
      // Always use filteredItems (full list) instead of the passed items (which are already filtered)
      return determineAvailableFilters(initialFilters, filteredItems, filterGroups);
    },
    [filteredItems],
  );

  // Performance optimization: Memoize sorted items with all filter dependencies
  const sortedItems = useMemo(() => {
    // Ensure we have items before processing - prevents race conditions on initial load
    if (!filteredItems || filteredItems.length === 0) {
      return [];
    }

    // Apply the same filtering logic that was in getFilteredItems()
    let items = filteredItems;

    if (selectedCategory !== 'all') {
      items = items.filter((item) => {
        if (!item.categories || !Array.isArray(item.categories)) {
          return false;
        }
        return item.categories.includes(selectedCategory);
      });
    }

    if (selectedSource !== 'all') {
      const sourcesToFilter = JSON.parse(selectedSource);
      items = items.filter((item) => sourcesToFilter.includes(item.source));
    }

    if (selectedProvider !== 'all') {
      const providersToFilter = JSON.parse(selectedProvider);
      items = items.filter((item) => {
        const providerValue = getProviderValue(item.provider);
        return providersToFilter.includes(providerValue);
      });
    }

    if (selectedCapabilityLevel !== 'all') {
      const capabilityLevelsToFilter = JSON.parse(selectedCapabilityLevel);
      items = items.filter((item) => {
        const itemCapability = (item as any).capabilityLevel;
        if (itemCapability) {
          if (Array.isArray(itemCapability)) {
            return itemCapability.some((level) => capabilityLevelsToFilter.includes(level));
          }
          if (typeof itemCapability === 'string') {
            return capabilityLevelsToFilter.includes(itemCapability);
          }
        }

        const specCapability = item?.obj?.spec?.capabilityLevel ?? '';
        if (specCapability && capabilityLevelsToFilter.includes(specCapability)) {
          return true;
        }

        const metadataCapability =
          item?.obj?.metadata?.annotations?.['operators.operatorframework.io/capability-level'] ??
          '';
        if (metadataCapability && capabilityLevelsToFilter.includes(metadataCapability)) {
          return true;
        }

        return false;
      });
    }

    if (selectedInfraFeatures !== 'all') {
      const infraFeaturesToFilter = JSON.parse(selectedInfraFeatures);
      items = items.filter((item) => {
        if (!item.infraFeatures || !Array.isArray(item.infraFeatures)) {
          return false;
        }
        return item.infraFeatures.some((feature) => infraFeaturesToFilter.includes(feature));
      });
    }

    if (selectedValidSubscriptionFilters !== 'all') {
      const validSubscriptionToFilter = JSON.parse(selectedValidSubscriptionFilters);
      items = items.filter((item) => {
        if (!item.validSubscriptionFilters || !Array.isArray(item.validSubscriptionFilters)) {
          return false;
        }
        return item.validSubscriptionFilters.some((filter) =>
          validSubscriptionToFilter.includes(filter),
        );
      });
    }

    // Don't filter by search term here - let TileViewPage handle it through keywordCompareWithScore
    // We only apply category and filter-based filtering, not keyword filtering
    // But we still need to pass the search term for correct relevance-based sorting
    return orderAndSortByRelevance(items, searchTerm);
  }, [
    filteredItems,
    searchTerm,
    selectedCategory,
    selectedSource,
    selectedProvider,
    selectedCapabilityLevel,
    selectedInfraFeatures,
    selectedValidSubscriptionFilters,
  ]);

  useEffect(() => {
    const detailsItemID = searchParams.get('details-item');
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
  }, [filteredItems, searchParams]);

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
    setTokenizedAuth(undefined);
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

  let installParamsURL = '';
  if (detailsItem && detailsItem.obj) {
    const installParams: Record<string, string> = {
      pkg: detailsItem.obj.metadata.name,
      catalog: detailsItem.catalogSource,
      catalogNamespace: detailsItem.catalogSourceNamespace,
      targetNamespace: props.namespace,
      channel: updateChannel,
      version: updateVersion,
    };
    if (tokenizedAuth) {
      installParams.tokenizedAuth = tokenizedAuth;
    }
    installParamsURL = new URLSearchParams(installParams).toString();
  }

  const installLink =
    detailsItem && detailsItem.obj && `/operatorhub/subscribe?${installParamsURL}`;

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

  /* eslint-disable */
  // CONSOLE TABLE FOR TESTING - Using memoized sorted data for performance
  // Displays search results with 'Search Relevance Score' and 'Is Red Hat' provider priority values, used in determining display order of operators
  
  const getActiveFiltersDescription = () => {
    const activeFilters = [];
    if (selectedCategory !== 'all') activeFilters.push(`Category: ${selectedCategory}`);
    if (selectedSource !== 'all') activeFilters.push(`Source: ${selectedSource}`);
    if (selectedProvider !== 'all') activeFilters.push(`Provider: ${selectedProvider}`);
    if (selectedCapabilityLevel !== 'all') activeFilters.push(`Capability Level: ${selectedCapabilityLevel}`);
    if (selectedInfraFeatures !== 'all') activeFilters.push(`Infrastructure Features: ${selectedInfraFeatures}`);
    if (selectedValidSubscriptionFilters !== 'all') activeFilters.push(`Valid Subscription: ${selectedValidSubscriptionFilters}`);
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters applied';
  };
  
  // Debug logging for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    if (searchTerm) {
      // For search terms, show filtered and sorted results (matching what the browser displays)
      const searchFilteredForDisplay = sortedItems
        .map((item) => ({
          ...item,
          relevanceScore: calculateRelevanceScore(searchTerm, item),
        }))
        .filter((item) => item.relevanceScore > 0);
      const searchSortedForDisplay = orderAndSortByRelevance(searchFilteredForDisplay, searchTerm);
      console.log('📋 OperatorHub Items Array (Search Filtered & Sorted):', searchSortedForDisplay.map(item => item.name || 'N/A'));
    } else {
      console.log('📋 OperatorHub Items Array:', sortedItems.map(item => item.name || 'N/A'));
    }
    
    // Debug: Log component state to identify race conditions
    console.log('🐛 Debug Info:', {
      searchTerm,
      filteredItemsCount: filteredItems?.length || 0,
      sortedItemsCount: sortedItems?.length || 0,
      hasSearchTerm: !!searchTerm,
      isInitialLoad: (!filteredItems || filteredItems.length === 0)
    });
    
    console.log(`📌 Current Active Filters: ${getActiveFiltersDescription()}`);
    console.log(`🔍 Search Term: "${searchTerm || 'none'}"`);
    console.log(`📊 Sorted Items Count: ${sortedItems.length}`);

    // Use memoized sortedItems instead of recalculating
    if (searchTerm && sortedItems.length > 0) {
    // For console display, filter items by search term since TileViewPage will do this later
    const searchFilteredItems = sortedItems
      .map((item) => ({
        ...item,
        relevanceScore: calculateRelevanceScore(searchTerm, item),
      }))
      .filter((item) => item.relevanceScore > 0);
    
    // Sort the filtered items the same way TileViewPage will sort them
    const searchSortedItems = orderAndSortByRelevance(searchFilteredItems, searchTerm);
    
    const tableData = searchSortedItems.map((item, index) => ({
        Title: item.name || 'N/A',
        'Search Relevance Score': item.relevanceScore || 0,
        'Is Red Hat Provider (Priority)': getRedHatPriority(item) === REDHAT_PRIORITY.EXACT_MATCH ? `Exact Match (${REDHAT_PRIORITY.EXACT_MATCH})` : 
                            getRedHatPriority(item) === REDHAT_PRIORITY.CONTAINS_REDHAT ? `Contains Red Hat (${REDHAT_PRIORITY.CONTAINS_REDHAT})` : `Non-Red Hat (${REDHAT_PRIORITY.NON_REDHAT})`,
        // Source: item.source || 'N/A',
        'Metadata Provider': _.get(item, 'obj.metadata.labels.provider', 'N/A'),
        'Capability Level': (() => {
          const itemCapability = (item as any).capabilityLevel;
          if (itemCapability) {
            if (Array.isArray(itemCapability)) {
              return itemCapability.join(', ');
            } else if (typeof itemCapability === 'string') {
              return itemCapability;
            }
          }
          
          const specCapability = _.get(item, 'obj.spec.capabilityLevel', '');
          if (specCapability) return specCapability;
          
          const metadataCapability = _.get(item, 'obj.metadata.annotations["operators.operatorframework.io/capability-level"]', '');
          if (metadataCapability) return metadataCapability;
          
          return 'N/A';
        })(),
        'Infrastructure Features': Array.isArray(item.infraFeatures) ? item.infraFeatures.join(', ') : 'N/A',
      }));
      
      console.log(`\n🔍 OperatorHub Search Results for "${searchTerm}" (${searchSortedItems.length} matches)`);
      console.log(`📌 Active Filters: ${getActiveFiltersDescription()}`);
      console.table(tableData);
    } else if (sortedItems.length > 0) {
      // Console table for filtered results without search term (category/filter-based) - using memoized data
      const tableData = sortedItems.map((item, index) => ({
        Title: item.name || 'N/A',
        'Is Red Hat Provider (Priority)': getRedHatPriority(item) === REDHAT_PRIORITY.EXACT_MATCH ? `Exact Match (${REDHAT_PRIORITY.EXACT_MATCH})` : 
                            getRedHatPriority(item) === REDHAT_PRIORITY.CONTAINS_REDHAT ? `Contains Red Hat (${REDHAT_PRIORITY.CONTAINS_REDHAT})` : `Non-Red Hat (${REDHAT_PRIORITY.NON_REDHAT})`,
        // Source: item.source || 'N/A',
        'Metadata Provider': _.get(item, 'obj.metadata.labels.provider', 'N/A'),
        'Capability Level': (() => {
          const itemCapability = (item as any).capabilityLevel;
          if (itemCapability) {
            if (Array.isArray(itemCapability)) {
              return itemCapability.join(', ');
            } else if (typeof itemCapability === 'string') {
              return itemCapability;
            }
          }
          
          const specCapability = _.get(item, 'obj.spec.capabilityLevel', '');
          if (specCapability) return specCapability;
          
          const metadataCapability = _.get(item, 'obj.metadata.annotations["operators.operatorframework.io/capability-level"]', '');
          if (metadataCapability) return metadataCapability;
          
          return 'N/A';
        })(),
        'Infrastructure Features': Array.isArray(item.infraFeatures) ? item.infraFeatures.join(', ') : 'N/A',
      }));
      
      console.log(`\n📂 OperatorHub Filtered Results (${tableData.length} items)`);
      console.log(`📌 Active Filters: ${getActiveFiltersDescription()}`);
      console.table(tableData);
    }
    /* eslint-enable */
  }

  return (
    <>
      <TileViewPage
        items={sortedItems}
        itemsSorter={orderAndSortByRelevance}
        getAvailableCategories={getAvailableCategoriesFromAllItems}
        getAvailableFilters={getAvailableFiltersFromAllItems}
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
