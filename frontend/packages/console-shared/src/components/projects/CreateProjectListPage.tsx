import * as React from 'react';
import { CreateProjectListPageProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { createProjectModal } from '@console/internal/components/modals';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import ProjectListPage from './ProjectListPage';

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
