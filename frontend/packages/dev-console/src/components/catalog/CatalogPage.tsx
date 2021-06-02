import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { useQueryParams } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import CatalogController from './CatalogController';
import useCatalogCategories from './hooks/useCatalogCategories';
import CatalogServiceProvider from './service/CatalogServiceProvider';
import { CatalogQueryParams } from './utils/types';

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
