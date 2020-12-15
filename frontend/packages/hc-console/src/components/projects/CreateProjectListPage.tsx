import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { createProjectModal } from '@console/internal/components/modals';
import { K8sResourceKind } from '@console/internal/module/k8s';
import ProjectListPage, { ProjectListPageProps } from './ProjectListPage';

export interface CreateProjectListPageProps extends ProjectListPageProps {
  onCreate: (project: K8sResourceKind) => void;
  title: string;
}

const CreateProjectListPage: React.FC<CreateProjectListPageProps> = ({
  onCreate,
  title,
  ...props
}) => {
  const openProjectModal = () => createProjectModal({ blocking: true, onSubmit: onCreate });

  return (
    <ProjectListPage {...props} title={title}>
      Select a project to start adding to it or{' '}
      <Button isInline variant="link" onClick={openProjectModal}>
        create a project
      </Button>
    </ProjectListPage>
  );
};

export default CreateProjectListPage;
