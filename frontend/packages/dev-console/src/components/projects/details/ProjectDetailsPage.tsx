import * as React from 'react';
import { Redirect } from 'react-router';
import { history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { useActiveNamespace } from '@console/shared/src/hooks';
import { ProjectsDetailsPage } from '@console/internal/components/namespace';
import { ProjectModel } from '@console/internal/models';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import { PROJECT_LIST_URI, redirectURI } from './utils';

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    return;
  }

  history.push(redirectURI(newNamespace));
};

const ProjectDetailsPage: React.FC = (props) => {
  const activeNamespace = useActiveNamespace();
  const allNamespaces = activeNamespace === ALL_NAMESPACES_KEY;

  if (allNamespaces) {
    return <Redirect to={PROJECT_LIST_URI} />;
  }

  return (
    <NamespacedPage
      hideApplications
      variant={NamespacedPageVariants.light}
      onNamespaceChange={handleNamespaceChange}
    >
      <ProjectsDetailsPage
        {...props}
        breadcrumbsFor={() => []}
        name={activeNamespace}
        kind={ProjectModel.kind}
        kindObj={ProjectModel}
      />
    </NamespacedPage>
  );
};

export default ProjectDetailsPage;
