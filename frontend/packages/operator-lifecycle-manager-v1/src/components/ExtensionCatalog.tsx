import { Trans, useTranslation } from 'react-i18next';
import { CatalogController, CatalogServiceProvider } from '@console/shared/src/components/catalog';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';

const ExtensionCatalog = () => {
  const { t } = useTranslation('olm-v1');
  const [namespace] = useActiveNamespace();
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
          title={t('Extension Catalog')}
          type="ExtensionCatalogItem"
          description={
            <Trans ns="olm-v1">
              Discover Operators from the Kubernetes community and Red Hat partners, curated by Red
              Hat. You can install Operators on your clusters to provide optional add-ons and shared
              services to your developers.
            </Trans>
          }
        />
      )}
    </CatalogServiceProvider>
  );
};

export default ExtensionCatalog;
