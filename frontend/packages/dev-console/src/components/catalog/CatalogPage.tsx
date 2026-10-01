import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { ErrorPage404 } from '@console/internal/components/error';
import { withStartGuide } from '@console/internal/components/start-guide';
import { ClassicOperatorMigrationAlert } from '@console/operator-lifecycle-manager/src/components/classic-operators/ClassicOperatorMigrationAlert';
import {
  LEGACY_OPERATOR_TYPE,
  OPERATOR_OLMV0_TYPE,
} from '@console/operator-lifecycle-manager/src/const';
import { CatalogController } from '@console/shared/src/components/catalog/CatalogController';
import { CatalogServiceProvider } from '@console/shared/src/components/catalog/service/CatalogServiceProvider';
import { isCatalogTypeEnabled } from '@console/shared/src/components/catalog/utils/catalog-utils';
import { CatalogQueryParams } from '@console/shared/src/components/catalog/utils/types';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useQueryParams } from '@console/shared/src/hooks/useQueryParams';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';

const PageContents: FC = () => {
  const { t } = useTranslation('devconsole');
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
    <CreateProjectListPage title={t('Software Catalog')}>
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
          helpAlert={catalogType === OPERATOR_OLMV0_TYPE && <ClassicOperatorMigrationAlert />}
          title={t('Software Catalog')}
          description={t(
            'Add shared applications, services, event sources, or source-to-image builders to your Project from the software catalog. Cluster administrators can customize the content made available in the catalog.',
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

  // The OLMv0 catalog type was renamed from `operator` to `operator-olmv0`. Keep the old value
  // working so existing links and bookmarks do not fall through to the 404 below.
  if (catalogType === LEGACY_OPERATOR_TYPE) {
    const params = new URLSearchParams(queryParams);
    params.set(CatalogQueryParams.TYPE, OPERATOR_OLMV0_TYPE);
    return <Navigate to={{ search: `?${params.toString()}` }} replace />;
  }

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
