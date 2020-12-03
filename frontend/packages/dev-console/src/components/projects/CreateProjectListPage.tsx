import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { createProjectModal } from '@console/internal/components/modals';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
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
  const { t } = useTranslation();
  const [, setActiveNamespace] = useActiveNamespace();
  const handleSubmit = (project: K8sResourceKind) => {
    setActiveNamespace(project.metadata?.name);
    onCreate && onCreate(project);
  };

  const openProjectModal = () => createProjectModal({ blocking: true, onSubmit: handleSubmit });

  return (
    <ProjectListPage {...props} title={title}>
      {children} {t('devconsole~or')}{' '}
      <Button isInline variant="link" onClick={openProjectModal}>
        {t('devconsole~Create a Project')}
      </Button>
    </ProjectListPage>
  );
};

export default CreateProjectListPage;
