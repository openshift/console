import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, NavigateFunction } from 'react-router-dom';
import { ProjectDashboard } from '@console/internal/components/dashboard/project-dashboard/project-dashboard';
import { DetailsPage } from '@console/internal/components/factory';
import { NamespaceDetails, projectMenuActions } from '@console/internal/components/namespace';
import { withStartGuide } from '@console/internal/components/start-guide';
import { useAccessReview, Page } from '@console/internal/components/utils';
import { ProjectModel, RoleBindingModel } from '@console/internal/models';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import ProjectAccessPage from '../../project-access/ProjectAccessPage';
import CreateProjectListPage, { CreateAProjectButton } from '../CreateProjectListPage';

export const PROJECT_DETAILS_ALL_NS_PAGE_URI = '/project-details/all-namespaces';

interface MonitoringPageProps {
  noProjectsAvailable?: boolean;
}

const handleNamespaceChange = (newNamespace: string, navigate: NavigateFunction): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    navigate(PROJECT_DETAILS_ALL_NS_PAGE_URI);
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
      breadcrumbsFor={() => [
        { name: t('devconsole~Projects'), path: '/project-details/all-namespaces' },
        { name: t('devconsole~Project Details'), path: `/project-details/ns/${activeNamespace}` },
      ]}
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
      <DocumentTitle>{t('devconsole~Project Details')}</DocumentTitle>
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
