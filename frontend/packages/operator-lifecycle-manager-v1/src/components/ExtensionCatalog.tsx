import * as React from 'react';
import { Page, PageSection } from '@patternfly/react-core';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  ConsoleEmptyState,
  PageHeading,
  skeletonCatalog,
  StatusBox,
} from '@console/internal/components/utils';
import {
  InstalledState,
  OperatorHubItem,
} from '@console/operator-lifecycle-manager/src/components/operator-hub';
import { OperatorHubTileView } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-items';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { ExtensionCatalogItem } from '../database/types';
import { useExtensionCatalogItems } from '../hooks/useExtensionCatalogItems';

const mapExtensionItemsToLegacyOperatorHubItems = (packages: ExtensionCatalogItem[]) => {
  return (packages ?? []).map<OperatorHubItem>(
    ({
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
      source,
      validSubscription,
    }) => ({
      authentication: null,
      capabilityLevel: capabilities,
      catalogSource: '',
      catalogSourceNamespace: '',
      categories,
      cloudCredentials: null,
      description: description || longDescription,
      infraFeatures: infrastructureFeatures,
      infrastructure: null,
      installed: false,
      installState: InstalledState.NotInstalled,
      kind: null,
      longDescription: longDescription || description,
      name: displayName || name,
      obj: null,
      provider,
      source,
      tags: keywords,
      uid: name,
      validSubscription,
      ...(icon ? { imgUrl: `data:${icon.mediatype};base64,${icon.base64data}` } : {}),
    }),
  );
};

const ExtensionCatalog = () => {
  const { t } = useTranslation('olm-v1');
  const [extensionCatalogItems, loading, error] = useExtensionCatalogItems();
  const [namespace] = useActiveNamespace();
  const legacyOpertorHubItems = mapExtensionItemsToLegacyOperatorHubItems(extensionCatalogItems);

  return (
    <Page>
      <PageSection hasBodyWrapper={false}>
        <Helmet>
          <title>{t('Extension Catalog')}</title>
        </Helmet>
        <PageHeading title={t('Extension Catalog')} />
        <StatusBox
          skeleton={skeletonCatalog}
          data={legacyOpertorHubItems}
          loaded={!loading}
          loadError={error}
          label={t('Extension Catalog items')}
          EmptyMsg={() => (
            <ConsoleEmptyState title={t('No Extension Catalog items found')}>
              {t(
                'Check that OLM v1 is configured and at least one valid ClusterCatalog has been created.',
              )}
            </ConsoleEmptyState>
          )}
        >
          <OperatorHubTileView items={legacyOpertorHubItems} namespace={namespace} />
        </StatusBox>
      </PageSection>
    </Page>
  );
};

export default ExtensionCatalog;
