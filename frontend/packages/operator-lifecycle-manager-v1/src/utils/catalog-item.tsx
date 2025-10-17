import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { CapabilityLevel } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-item-details';
import {
  infrastructureFeatureMap,
  validSubscriptionReducer,
} from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import PlainList from '@console/shared/src/components/lists/PlainList';
import { OLMCatalogItem, OLMCatalogItemData } from '../types';

type NormalizeExtensionCatalogItem = (item: OLMCatalogItem) => CatalogItem<OLMCatalogItemData>;
export const normalizeCatalogItem: NormalizeExtensionCatalogItem = (pkg) => {
  const {
    id,
    capabilities,
    catalog,
    categories,
    createdAt,
    description,
    displayName,
    image,
    infrastructureFeatures,
    keywords,
    markdownDescription,
    name,
    provider,
    repository,
    source,
    support,
    validSubscription,
    version,
  } = pkg;
  const [validSubscriptions, validSubscriptionFilters] = validSubscriptionReducer(
    validSubscription,
  );
  const normalizedInfrastructureFeatures = infrastructureFeatures?.reduce(
    (acc, feature) =>
      infrastructureFeatureMap[feature] ? [...acc, infrastructureFeatureMap[feature]] : acc,
    [],
  );
  const tags = (categories ?? []).map((cat) => cat.toLowerCase().trim()).filter(Boolean);
  return {
    attributes: {
      keywords,
      source,
      provider,
      infrastructureFeatures: normalizedInfrastructureFeatures,
      capabilities,
      validSubscription: validSubscriptionFilters,
    },
    creationTimestamp: createdAt,
    cta: {
      label: 'Install',
      href: `/ecosystem/catalog/install/${catalog}/${name}`,
    },
    description: description || markdownDescription,
    data: {
      latestVersion: version,
      categories,
    },
    details: {
      properties: [
        {
          label: 'Capability level',
          value: <CapabilityLevel capability={capabilities} />,
        },
        { label: 'Source', value: source || '-' },
        { label: 'Provider', value: provider || '-' },
        {
          label: 'Infrastructure features',
          value: normalizedInfrastructureFeatures?.length ? (
            <PlainList items={normalizedInfrastructureFeatures} />
          ) : (
            '-'
          ),
        },
        {
          label: 'Valid subscriptions',
          value: validSubscriptions?.length ? <PlainList items={validSubscriptions} /> : '-',
        },
        {
          label: 'Repository',
          value: repository ? <ExternalLink href={repository} text={repository} /> : '-',
        },
        { label: 'Container image', value: image || '-' },
        { label: 'Created at', value: createdAt ? <Timestamp timestamp={createdAt} /> : '-' },
        { label: 'Support', value: support || '-' },
      ],
      descriptions: [{ value: <SyncMarkdownView content={markdownDescription || description} /> }],
    },
    displayName,
    // icon: icon ? { url: `data:${icon.mediatype};base64,${icon.base64data}` } : null,
    name: displayName || name,
    supportUrl: support,
    provider,
    tags,
    type: 'OLMv1CatalogItem',
    typeLabel: source,
    uid: id,
  };
};
