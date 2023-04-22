import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { createProjectModal } from '@console/internal/components/modals';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FLAGS, useActiveNamespace, useFlag } from '@console/shared';
import ProjectListPage, { ProjectListPageProps } from './ProjectListPage';

type LazySubTitleRender = (openProjectModal: () => void) => React.ReactNode;
export interface CreateProjectListPageProps extends ProjectListPageProps {
  title: string;
  children: LazySubTitleRender;
  onCreate?: (project: K8sResourceKind) => void;
}

type CreateAProjectButtonProps = {
  openProjectModal: () => void;
};

export const CreateAProjectButton: React.FC<CreateAProjectButtonProps> = ({ openProjectModal }) => {
  const { t } = useTranslation();
  const canCreateProject = useFlag(FLAGS.CAN_CREATE_PROJECT);
  return (
    canCreateProject && (
      <Trans t={t} ns="devconsole">
        {' or '}
        <Button isInline variant="link" onClick={openProjectModal}>
          create a Project
        </Button>
      </Trans>
    )
  );
};

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
