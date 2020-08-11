import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { Button } from '@patternfly/react-core';
import { createProjectModal } from '@console/internal/components/modals';
import { setActiveNamespace } from '@console/internal/actions/ui';
import { K8sResourceKind } from '@console/internal/module/k8s';
import ProjectListPage, { ProjectListPageProps } from './ProjectListPage';

export interface CreateProjectListPageProps extends ProjectListPageProps {
  title: string;
  onCreate?: (project: K8sResourceKind) => void;
}

const CreateProjectListPage: React.FC<CreateProjectListPageProps> = ({
  onCreate,
  title,
  children,
  ...props
}) => {
  const dispatch = useDispatch();

  const handleSubmit = (project: K8sResourceKind) => {
    dispatch(setActiveNamespace(project.metadata?.name));
    onCreate && onCreate(project);
  };

  const openProjectModal = () => createProjectModal({ blocking: true, onSubmit: handleSubmit });

  return (
    <ProjectListPage {...props} title={title}>
      {children} or{' '}
      <Button isInline variant="link" onClick={openProjectModal}>
        create a project
      </Button>
    </ProjectListPage>
  );
};

export default CreateProjectListPage;
