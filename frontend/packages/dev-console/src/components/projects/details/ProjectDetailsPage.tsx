import * as React from 'react';
import Helmet from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ProjectDashboard } from '@console/internal/components/dashboard/project-dashboard/project-dashboard';
import { DetailsPage } from '@console/internal/components/factory';
import { NamespaceDetails, projectMenuActions } from '@console/internal/components/namespace';
import { withStartGuide } from '@console/internal/components/start-guide';
import { history, useAccessReview, Page } from '@console/internal/components/utils';
import { ProjectModel, RoleBindingModel } from '@console/internal/models';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import ProjectAccessPage from '../../project-access/ProjectAccessPage';
import CreateProjectListPage, { CreateAProjectButton } from '../CreateProjectListPage';

export const PROJECT_DETAILS_ALL_NS_PAGE_URI = '/project-details/all-namespaces';

interface MonitoringPageProps {
  noProjectsAvailable?: boolean;
}

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push(PROJECT_DETAILS_ALL_NS_PAGE_URI);
  }
};

export const PageContents: React.FC<MonitoringPageProps> = ({ noProjectsAvailable, ...props }) => {
  const { t } = useTranslation();
  const params = useParams();
  const activeNamespace = params.ns;

  const canListRoleBindings = useAccessReview({
    group: RoleBindingModel.apiGroup,
    resource: RoleBindingModel.plural,
    verb: 'list',
    namespace: activeNamespace,
  });

  const canCreateRoleBindings = useAccessReview({
    group: RoleBindingModel.apiGroup,
    resource: RoleBindingModel.plural,
    verb: 'create',
    namespace: activeNamespace,
  });

  const pages: Page[] = [
    {
      href: '',
      // t('devconsole~Overview')
      nameKey: 'devconsole~Overview',
      component: ProjectDashboard,
    },
    {
      href: 'details',
      // t('devconsole~Details')
      nameKey: 'devconsole~Details',
      component: NamespaceDetails,
    },
  ];
  if (canListRoleBindings && canCreateRoleBindings) {
    pages.push({
      href: 'access',
      // t('devconsole~Project access')
      nameKey: 'devconsole~Project access',
      component: ProjectAccessPage,
    });
  }

  return !noProjectsAvailable && activeNamespace ? (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => []}
      name={activeNamespace}
      kind={ProjectModel.kind}
      kindObj={ProjectModel}
      menuActions={projectMenuActions}
      customData={{ activeNamespace, hideHeading: true }}
      pages={pages}
    />
  ) : (
    <CreateProjectListPage title={t('devconsole~Project Details')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to view its details
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const ProjectDetailsPage: React.FC<MonitoringPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Project Details')}</title>
      </Helmet>
      <NamespacedPage
        hideApplications
        variant={NamespacedPageVariants.light}
        onNamespaceChange={handleNamespaceChange}
      >
        <PageContentsWithStartGuide {...props} />
      </NamespacedPage>
    </>
  );
};

export default ProjectDetailsPage;
