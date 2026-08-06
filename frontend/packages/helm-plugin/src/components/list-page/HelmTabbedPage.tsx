import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { useAccessReview, useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { withStartGuide } from '@console/internal/components/start-guide';
import type { Page } from '@console/internal/components/utils';
import { LoadingBox } from '@console/internal/components/utils';
import type { MenuActions } from '@console/shared/src/components/multi-tab-list/multi-tab-list-page-types';
import { MultiTabListPage } from '@console/shared/src/components/multi-tab-list/MultiTabListPage';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models/helm';
import HelmReleaseList from './HelmReleaseList';
import HelmReleaseListPage from './HelmReleaseListPage';
import RepositoriesPage from './RepositoriesListPage';

const HelmPage: FC<{ mock?: boolean; namespace: string | undefined }> = ({ mock, namespace }) => {
  const { t } = useTranslation('helm-plugin');
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
      label: isHelmVisible ? t('Helm release') : undefined,
      onSelection: () => `/catalog/ns/${namespace || 'default'}?catalogType=HelmChart`,
    },
    projectHelmChartRepository: {
      label: projectHelmChartCreateAccess || helmChartCreateAccess ? t('Repository') : undefined,
      onSelection: () => `/helm-repositories/ns/${namespace || 'default'}/~new/form`,
    },
    helmChartInstallation: {
      label:
        projectHelmChartCreateAccess || helmChartCreateAccess ? t('Helm Chart URL') : undefined,
      onSelection: () => `/helm/ns/${namespace || 'default'}/url-chart`,
    },
  };

  const pages: Page[] = [
    {
      href: '',
      // t('helm-plugin~Helm releases')
      nameKey: 'helm-plugin~Helm releases',
      component: HelmReleaseList,
      pageData: {
        mock,
      },
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
      title={t('Helm')}
      menuActions={menuActions}
      telemetryPrefix="Helm"
    />
  ) : (
    <HelmReleaseListPage mock={mock} />
  );
};

const PageContents: FC<{ noProjectsAvailable?: boolean }> = ({ noProjectsAvailable }) => {
  const { t } = useTranslation('helm-plugin');
  const { ns: namespace } = useParams();
  const [activePerspective] = useActivePerspective();

  return activePerspective === 'admin' || namespace ? (
    <HelmPage namespace={namespace} mock={noProjectsAvailable} />
  ) : (
    <CreateProjectListPage title={t('Helm')}>
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

const HelmTabbedPage: FC = (props) => {
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default HelmTabbedPage;
