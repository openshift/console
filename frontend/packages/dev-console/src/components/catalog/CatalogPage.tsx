import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { NamespacedPageVariants } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import {
  useQueryParams,
  CatalogQueryParams,
  CatalogServiceProvider,
  useCatalogCategories,
  CatalogController,
} from '@console/shared';
import CreateProjectListPage from '@console/shared/src/components/projects/CreateProjectListPage';
import NamespacedPage from '@console/shared/src/components/projects/NamespacedPage';

type CatalogPageProps = RouteComponentProps<{
  ns?: string;
}>;

const CatalogPage: React.FC<CatalogPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const catalogType = queryParams.get(CatalogQueryParams.TYPE);
  const namespace = match.params.ns;
  const categories = useCatalogCategories();

  return (
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
              Select a Project to view the developer catalog or{' '}
              <Button isInline variant="link" onClick={openProjectModal}>
                create a Project
              </Button>
              .
            </Trans>
          )}
        </CreateProjectListPage>
      )}
    </NamespacedPage>
  );
};

export default CatalogPage;
