// This file will be removed as part of https://issues.redhat.com//browse/CONSOLE-4668
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { CapabilityLevel } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-item-details';
import { validSubscriptionReducer } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import PlainList from '@console/shared/src/components/lists/PlainList';
import { ExtensionCatalogItem } from './types';

type NormalizeExtensionCatalogItem = (item: ExtensionCatalogItem) => CatalogItem;
export const normalizeExtensionCatalogItem: NormalizeExtensionCatalogItem = (pkg) => {
  const {
    catalog,
    categories,
    capabilities,
    description,
    displayName,
    icon,
    infrastructureFeatures,
    keywords,
    longDescription,
    name,
    provider,
    repository,
    support,
    image,
    source,
    validSubscription,
    createdAt,
  } = pkg;
  const [validSubscriptions, validSubscriptionFilters] = validSubscriptionReducer(
    validSubscription ?? [],
  );
  return {
    attributes: {
      keywords,
      source,
      provider,
      infrastructureFeatures,
      capabilities,
      validSubscription: validSubscriptionFilters,
    },
    creationTimestamp: createdAt,
    cta: {
      label: 'Install',
      href: `/ecosystem/catalog/install/${catalog}/${name}`,
    },
    description: description || longDescription,
    details: {
      properties: [
        {
          label: 'Capability level',
          value: <CapabilityLevel capability={capabilities ?? ''} />,
        },
        { label: 'Source', value: source || '-' },
        { label: 'Provider', value: provider || '-' },
        {
          label: 'Infrastructure features',
          value: infrastructureFeatures?.length ? (
            <PlainList items={infrastructureFeatures} />
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
      descriptions: [{ value: <SyncMarkdownView content={longDescription} /> }],
    },
    displayName,
    icon: icon ? { url: `data:${icon.mediatype};base64,${icon.base64data}` } : undefined,
    name: displayName || name,
    supportUrl: support,
    provider,
    tags: categories,
    type: 'ExtensionCatalogItem',
    typeLabel: source,
    uid: `${catalog}-${name}`,
  };
};
