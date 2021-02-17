import * as React from 'react';
import { createProjectModal } from '@console/internal/components/modals';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import ProjectListPage, { ProjectListPageProps } from './ProjectListPage';

type LazySubTitleRender = (openProjectModal: () => void) => React.ReactNode;
export interface CreateProjectListPageProps extends ProjectListPageProps {
  title: string;
  children: LazySubTitleRender;
  onCreate?: (project: K8sResourceKind) => void;
}

const CreateProjectListPage: React.FC<CreateProjectListPageProps> = ({
  onCreate,
  title,
  children,
  ...props
}) => {
  const [, setActiveNamespace] = useActiveNamespace();
  const handleSubmit = (project: K8sResourceKind) => {
    setActiveNamespace(project.metadata?.name);
    onCreate && onCreate(project);
  };
  const openProjectModal = () => createProjectModal({ blocking: true, onSubmit: handleSubmit });
  return (
    <ProjectListPage {...props} title={title}>
      {children(openProjectModal)}
    </ProjectListPage>
  );
};

export default CreateProjectListPage;
