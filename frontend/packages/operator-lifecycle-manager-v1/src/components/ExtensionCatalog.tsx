import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  ConsoleEmptyState,
  PageHeading,
  skeletonCatalog,
  StatusBox,
} from '@console/internal/components/utils';
import { OperatorHubTileView } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-items';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useExtensionCatalogItems } from '../hooks/useExtensionCatalogItems';

const ExtensionCatalog = () => {
  const { t } = useTranslation('olm-v1');
  const [items, loading, error] = useExtensionCatalogItems();
  const [namespace] = useActiveNamespace();

  return (
    <>
      <Helmet>
        <title>{t('Extension Catalog')}</title>
      </Helmet>
      <div className="co-m-page__body">
        <div className="co-catalog">
          <PageHeading title={t('Extension Catalog')} />
          <StatusBox
            skeleton={skeletonCatalog}
            data={items}
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
            <OperatorHubTileView items={items} namespace={namespace} />
          </StatusBox>
        </div>
      </div>
    </>
  );
};

export default ExtensionCatalog;
