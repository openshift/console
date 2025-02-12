import * as React from 'react';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { Timestamp } from '@console/internal/components/utils';
import { CapabilityLevel } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-item-details';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { PlainList } from '@console/shared/src/components/lists/PlainList';
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
  return {
    attributes: {
      keywords,
      source,
      provider,
      infrastructureFeatures,
      validSubscription,
      capabilities,
    },
    creationTimestamp: createdAt,
    cta: {
      label: 'Install',
      href: `/ecosystem/catalog/install/${catalog}/${name}`,
    },
    description,
    details: {
      properties: [
        {
          label: 'Capability level',
          value: <CapabilityLevel capability={capabilities} />,
        },
        { label: 'Source', value: source },
        { label: 'Provider', value: provider },
        { label: 'Infrastructure features', value: <PlainList items={infrastructureFeatures} /> },
        { label: 'Valid subscriptions', value: <PlainList items={validSubscription} /> },
        {
          label: 'Repository',
          value: repository ? <ExternalLink href={repository} /> : null,
        },
        { label: 'Container image', value: image },
        { label: 'Created at', value: <Timestamp timestamp={createdAt} /> },
        { label: 'Support', value: support },
      ],
      descriptions: [{ value: longDescription }],
    },
    displayName,
    icon: icon ? { url: `data:${icon.mediatype};base64,${icon.base64data}` } : null,
    name: displayName || name,
    supportUrl: support,
    provider,
    tags: categories,
    type: 'ExtensionCatalogItem',
    typeLabel: source,
    uid: `${catalog}-${name}`,
  };
};
