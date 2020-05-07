import * as React from 'react';
import { match as RMatch } from 'react-router';
import { history, useAccessReview } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { NamespaceDetails, projectMenuActions } from '@console/internal/components/namespace';
import { ProjectModel, RoleBindingModel } from '@console/internal/models';
import { DetailsPage } from '@console/internal/components/factory';
import { ProjectDashboard } from '@console/internal/components/dashboard/project-dashboard/project-dashboard';
import { withStartGuide } from '@console/internal/components/start-guide';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import ProjectAccessPage from '../../project-access/ProjectAccessPage';
import { Helmet } from 'react-helmet';
import ProjectListPage from '../ProjectListPage';

export const PROJECT_DETAILS_ALL_NS_PAGE_URI = '/project-details/all-namespaces';

interface MonitoringPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push(PROJECT_DETAILS_ALL_NS_PAGE_URI);
  }
};

export const ProjectDetailsPage: React.FC<MonitoringPageProps> = ({ match, ...props }) => {
  const activeNamespace = match.params.ns;

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

  return (
    <>
      <Helmet>
        <title>Project Details</title>
      </Helmet>
      <NamespacedPage
        hideApplications
        variant={NamespacedPageVariants.light}
        onNamespaceChange={handleNamespaceChange}
      >
        {activeNamespace ? (
          <DetailsPage
            {...props}
            match={match}
            breadcrumbsFor={() => []}
            name={activeNamespace}
            kind={ProjectModel.kind}
            kindObj={ProjectModel}
            menuActions={projectMenuActions}
            customData={{ activeNamespace, hideHeading: true }}
            pages={[
              {
                href: '',
                name: 'Overview',
                component: ProjectDashboard,
              },
              {
                href: 'details',
                name: 'Details',
                component: NamespaceDetails,
              },
              canListRoleBindings &&
                canCreateRoleBindings && {
                  href: 'access',
                  name: 'Project Access',
                  component: ProjectAccessPage,
                },
            ]}
          />
        ) : (
          <ProjectListPage title="Project Details">
            Select a project to view its details
          </ProjectListPage>
        )}
      </NamespacedPage>
    </>
  );
};

export default withStartGuide(ProjectDetailsPage);
