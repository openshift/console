import * as React from 'react';
import { Redirect } from 'react-router';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import { ProjectsDetailsPage } from '@console/internal/components/namespace';
import { ProjectModel } from '@console/internal/models';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import { PROJECT_LIST_URI, useActiveNamespace, UseActiveNamespaceProps } from './utils';

export const ProjectDetailsPage: React.FC<UseActiveNamespaceProps> = ({
  activeNamespace,
  ...props
}) => {
  const allNamespaces = activeNamespace === ALL_NAMESPACES_KEY;

  if (allNamespaces) {
    return <Redirect to={PROJECT_LIST_URI} />;
  }

  return (
    <NamespacedPage hideApplications variant={NamespacedPageVariants.light}>
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
