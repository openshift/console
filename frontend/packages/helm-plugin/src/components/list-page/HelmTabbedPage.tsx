import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { useAccessReview, useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { withStartGuide } from '@console/internal/components/start-guide';
import { LoadingBox, Page } from '@console/internal/components/utils';
import { MenuActions, MultiTabListPage, useFlag } from '@console/shared';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';
import HelmReleaseList from './HelmReleaseList';
import HelmReleaseListPage from './HelmReleaseListPage';
import RepositoriesPage from './RepositoriesListPage';

const HelmPage: React.FC<{ namespace: string | undefined }> = ({ namespace }) => {
  const { t } = useTranslation();
  const isHelmVisible = useFlag('HELM_CHARTS_CATALOG_TYPE');
  const [showTitle, canCreate] = [false, false];
  const [projectHelmChartCreateAccess, loadingCreatePHCR] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'create',
    namespace,
  });
  const [helmChartCreateAccess, loadingCreateHCR] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'create',
  });
  const [projectHelmChartEditAccess, loadingEditPHCR] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'update',
    namespace,
  });
  const [helmChartEditAccess, loadingEditHCR] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'update',
  });
  const [projectHelmChartListAccess, loadingPHCR] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'list',
    namespace,
  });

  const [helmChartListAccess, loadingHCR] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'list',
  });

  const menuActions: MenuActions = {
    helmRelease: {
      label: isHelmVisible ? t('helm-plugin~Helm Release') : undefined,
      onSelection: () => `/catalog/ns/${namespace || 'default'}?catalogType=HelmChart`,
    },
    projectHelmChartRepository: {
      label:
        projectHelmChartCreateAccess || helmChartCreateAccess
          ? t('helm-plugin~Repository')
          : undefined,
      onSelection: () => `/helm-repositories/ns/${namespace || 'default'}/~new/form`,
    },
  };

  const pages: Page[] = [
    {
      href: '',
      // t('helm-plugin~Helm Releases')
      nameKey: 'helm-plugin~Helm Releases',
      component: HelmReleaseList,
    },
    {
      href: 'repositories',
      // t('helm-plugin~Repositories')
      nameKey: 'helm-plugin~Repositories',
      component: RepositoriesPage,
      pageData: {
        showTitle,
        canCreate,
      },
    },
  ];

  if (
    loadingCreatePHCR ||
    loadingEditPHCR ||
    loadingCreateHCR ||
    loadingEditHCR ||
    loadingPHCR ||
    loadingHCR
  ) {
    return <LoadingBox />;
  }

  return (projectHelmChartListAccess &&
    projectHelmChartCreateAccess &&
    projectHelmChartEditAccess) ||
    (helmChartListAccess && helmChartCreateAccess && helmChartEditAccess) ? (
    <MultiTabListPage
      pages={pages}
      title={t('helm-plugin~Helm')}
      menuActions={menuActions}
      telemetryPrefix="Helm"
    />
  ) : (
    <HelmReleaseListPage />
  );
};

export const PageContents: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const [activePerspective] = useActivePerspective();

  return activePerspective === 'admin' || namespace ? (
    <HelmPage namespace={namespace} />
  ) : (
    <CreateProjectListPage title={t('helm-plugin~Helm')}>
      {(openProjectModal) => (
        <Trans t={t} ns="helm-plugin">
          Select a Project to view its details
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const HelmTabbedPage: React.FC = (props) => {
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default HelmTabbedPage;
