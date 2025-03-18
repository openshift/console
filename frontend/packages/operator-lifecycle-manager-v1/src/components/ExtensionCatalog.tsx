import { Trans, useTranslation } from 'react-i18next';
import { DOC_URL_RED_HAT_MARKETPLACE } from '@console/internal/components/utils';
import { CatalogController, CatalogServiceProvider } from '@console/shared/src/components/catalog';
import ExternalLink from '@console/shared/src/components/links/ExternalLink';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useExtensionCatalogCategories } from '../hooks/useExtensionCatalogCategories';

const ExtensionCatalog = () => {
  const { t } = useTranslation('olm-v1');
  const [namespace] = useActiveNamespace();
  const [categories, loading, error] = useExtensionCatalogCategories();

  return (
    <CatalogServiceProvider
      catalogType="ExtensionCatalogItem"
      namespace={namespace}
      catalogId="olm-extension-catalog"
    >
      {(service) => (
        <CatalogController
          {...service}
          enableDetailsPanel
          categories={categories}
          title={t('Extension Catalog')}
          type="ExtensionCatalogItem"
          loaded={!loading}
          loadError={error}
          description={
            <Trans ns="olm-v1">
              Discover Operators from the Kubernetes community and Red Hat partners, curated by Red
              Hat. You can purchase commercial software through{' '}
              <ExternalLink href={DOC_URL_RED_HAT_MARKETPLACE}>Red Hat Marketplace</ExternalLink>.
              You can install Operators on your clusters to provide optional add-ons and shared
              services to your developers.
            </Trans>
          }
        />
      )}
    </CatalogServiceProvider>
  );
};

export default ExtensionCatalog;
