import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { withStartGuide } from '@console/internal/components/start-guide';
import { Page } from '@console/internal/components/utils';
import { MenuActions, MultiTabListPage } from '@console/shared';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';
import HelmReleaseList from './HelmReleaseList';
import RepositoriesPage from './RepositoriesListPage';

type HelmTabbedPageProps = RouteComponentProps<{ ns: string }>;

export const PageContents: React.FC<HelmTabbedPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  const [showTitle, canCreate] = [false, false];
  const [projectHelmChartAccess] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'create',
    namespace,
  });
  const [helmChartAccess] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'create',
  });

  const menuActions: MenuActions = {
    helmRelease: {
      label: t('helm-plugin~Helm Release'),
      onSelection: () => `/catalog/ns/${namespace}?catalogType=HelmChart`,
    },
    projectHelmChartRepository: {
      label: projectHelmChartAccess || helmChartAccess ? t('helm-plugin~Repository') : null,
      onSelection: () => `/ns/${namespace}/helmchartrepositories/~new?actionOrigin=list`,
    },
  };

  const pages: Page[] = [
    {
      href: '',
      name: t('helm-plugin~Helm Releases'),
      component: HelmReleaseList,
    },
    {
      href: 'repositories',
      name: t('helm-plugin~Repositories'),
      component: RepositoriesPage,
      pageData: {
        showTitle,
        canCreate,
      },
    },
  ];

  return namespace ? (
    <MultiTabListPage
      pages={pages}
      match={props.match}
      title={t('helm-plugin~Helm')}
      menuActions={menuActions}
    />
  ) : (
    <CreateProjectListPage title={t('helm-plugin~Helm')}>
      {(openProjectModal) => (
        <Trans t={t} ns="helm-plugin">
          Select a Project to view its details or{' '}
          <Button isInline variant="link" onClick={openProjectModal}>
            create a Project
          </Button>
          .
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const HelmTabbedPage: React.FC<HelmTabbedPageProps> = (props) => {
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default HelmTabbedPage;
