import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ErrorPage404 } from '@console/internal/components/error';
import { withStartGuide } from '@console/internal/components/start-guide';
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

const PageContents: React.FC = () => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const catalogType = queryParams.get(CatalogQueryParams.TYPE);
  const { ns: namespace } = useParams();
  const categories = useCatalogCategories();

  return namespace ? (
    <CatalogServiceProvider namespace={namespace} catalogId="dev-catalog" catalogType={catalogType}>
      {(service) => (
        <CatalogController
          {...service}
          enableDetailsPanel
          categories={categories}
          title={t('devconsole~Software Catalog')}
          description={t(
            'devconsole~Add shared applications, services, event sources, or source-to-image builders to your Project from the software catalog. Cluster administrators can customize the content made available in the catalog.',
          )}
        />
      )}
    </CatalogServiceProvider>
  ) : (
    <CreateProjectListPage title={t('devconsole~Software Catalog')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to view the software catalog
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const CatalogPage: React.FC = () => {
  const queryParams = useQueryParams();
  const catalogType = queryParams.get(CatalogQueryParams.TYPE);
  const isCatalogEnabled = isCatalogTypeEnabled(catalogType);

  if (catalogType && !isCatalogEnabled) {
    return <ErrorPage404 />;
  }

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide />
    </NamespacedPage>
  );
};

export default CatalogPage;
