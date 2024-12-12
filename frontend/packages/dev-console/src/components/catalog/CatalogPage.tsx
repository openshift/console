import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ErrorPage404 } from '@console/internal/components/error';
import {
  useQueryParams,
  CatalogQueryParams,
  CatalogServiceProvider,
  useCatalogCategories,
  CatalogController,
  isCatalogTypeEnabled,
} from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';

const CatalogPage: React.FC = () => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const catalogType = queryParams.get(CatalogQueryParams.TYPE);
  const { ns: namespace } = useParams();
  const categories = useCatalogCategories();
  const isCatalogEnabled = isCatalogTypeEnabled(catalogType);
  return catalogType && !isCatalogEnabled ? (
    <ErrorPage404 />
  ) : (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      {namespace ? (
        <CatalogServiceProvider
          namespace={namespace}
          catalogId="dev-catalog"
          catalogType={catalogType}
        >
          {(service) => (
            <CatalogController
              {...service}
              enableDetailsPanel
              categories={categories}
              title={t('devconsole~Developer Catalog')}
              description={t(
                'devconsole~Add shared applications, services, event sources, or source-to-image builders to your Project from the developer catalog. Cluster administrators can customize the content made available in the catalog.',
              )}
            />
          )}
        </CatalogServiceProvider>
      ) : (
        <CreateProjectListPage title={t('devconsole~Developer Catalog')}>
          {(openProjectModal) => (
            <Trans t={t} ns="devconsole">
              Select a Project to view the developer catalog
              <CreateAProjectButton openProjectModal={openProjectModal} />.
            </Trans>
          )}
        </CreateProjectListPage>
      )}
    </NamespacedPage>
  );
};

export default CatalogPage;
