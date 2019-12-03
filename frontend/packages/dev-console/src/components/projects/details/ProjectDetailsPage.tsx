import * as React from 'react';
import { Redirect } from 'react-router';
import { history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { ProjectsDetailsPage } from '@console/internal/components/namespace';
import { ProjectModel } from '@console/internal/models';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import {
  PROJECT_LIST_URI,
  redirectURI,
  useActiveNamespace,
  UseActiveNamespaceProps,
} from './utils';

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    return;
  }

  history.push(redirectURI(newNamespace));
};

export const ProjectDetailsPage: React.FC<UseActiveNamespaceProps> = ({
  activeNamespace,
  ...props
}) => {
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

export default useActiveNamespace(ProjectDetailsPage);
