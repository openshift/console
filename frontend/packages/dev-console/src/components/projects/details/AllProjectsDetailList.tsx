import * as React from 'react';
import { Redirect } from 'react-router';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { useActiveNamespace } from '@console/shared/src/hooks';
import { ProjectList } from '@console/internal/components/namespace';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import CreateProjectListPage from '../CreateProjectListPage';
import { redirectURI } from './utils';

const handleProjectCreate = (project: K8sResourceKind) =>
  history.push(redirectURI(project.metadata.name));

const AllProjectsDetailList: React.FC = () => {
  const activeNamespace = useActiveNamespace();
  const allNamespaces = activeNamespace === ALL_NAMESPACES_KEY;

  if (!allNamespaces) {
    return <Redirect to={redirectURI(activeNamespace)} />;
  }

  return (
    <NamespacedPage hideApplications variant={NamespacedPageVariants.light}>
      <CreateProjectListPage
        listComponent={ProjectList}
        onCreate={handleProjectCreate}
        title="Project Details"
      />
    </NamespacedPage>
  );
};

export default AllProjectsDetailList;
