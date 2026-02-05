import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { ErrorPage404 } from '@console/internal/components/error';
import { withStartGuide } from '@console/internal/components/start-guide';
import {
  useQueryParams,
  CatalogQueryParams,
  CatalogServiceProvider,
  CatalogController,
  isCatalogTypeEnabled,
  ALL_NAMESPACES_KEY,
  useActiveNamespace,
} from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';

const PageContents: FC = () => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const catalogType = queryParams.get(CatalogQueryParams.TYPE);
  const [activePerspective] = useActivePerspective();
  const [namespace] = useActiveNamespace();
  const isAllNamespaces = namespace === ALL_NAMESPACES_KEY;
  const isDevPerspective = activePerspective === 'dev';

  // Maintain existing behavior of the +Add page in the dev perspective.
  const showCreateProjectListPage = isDevPerspective && isAllNamespaces;

  if (!namespace) {
    return null;
  }

  return showCreateProjectListPage ? (
    <CreateProjectListPage title={t('devconsole~Software Catalog')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to view the software catalog
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  ) : (
    <CatalogServiceProvider
      namespace={isAllNamespaces ? '' : namespace}
      catalogId="dev-catalog"
      catalogType={catalogType}
    >
      {(service) => (
        <CatalogController
          {...service}
          enableDetailsPanel
          title={t('devconsole~Software Catalog')}
          description={t(
            'devconsole~Add shared applications, services, event sources, or source-to-image builders to your Project from the software catalog. Cluster administrators can customize the content made available in the catalog.',
          )}
        />
      )}
    </CatalogServiceProvider>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const CatalogPage: FC = () => {
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
