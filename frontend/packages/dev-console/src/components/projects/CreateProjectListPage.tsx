import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FLAGS, useActiveNamespace, useFlag } from '@console/shared';
import { useCreateNamespaceOrProjectModal } from '@console/shared/src/hooks/useCreateNamespaceOrProjectModal';
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
  const canCreateNs = useFlag(FLAGS.CAN_CREATE_NS);
  const canCreateProject = useFlag(FLAGS.CAN_CREATE_PROJECT);
  if (canCreateProject) {
    return (
      <Trans t={t} ns="devconsole">
        {' or '}
        <Button isInline variant="link" onClick={openProjectModal}>
          create a Project
        </Button>
      </Trans>
    );
  }
  if (canCreateNs) {
    return (
      <Trans t={t} ns="devconsole">
        {' or '}
        <Button isInline variant="link" onClick={openProjectModal}>
          create a Namespace
        </Button>
      </Trans>
    );
  }
  return null;
};

const CreateProjectListPage: React.FC<CreateProjectListPageProps> = ({
  onCreate,
  title,
  children,
  ...props
}) => {
  const [, setActiveNamespace] = useActiveNamespace();
  const createNamespaceOrProjectModal = useCreateNamespaceOrProjectModal();
  const openProjectModal = React.useCallback(() => {
    const handleSubmit = (project: K8sResourceKind) => {
      setActiveNamespace(project.metadata?.name);
      onCreate && onCreate(project);
    };
    createNamespaceOrProjectModal({ onSubmit: handleSubmit });
  }, [onCreate, setActiveNamespace, createNamespaceOrProjectModal]);
  return (
    <ProjectListPage {...props} title={title}>
      {children(openProjectModal)}
    </ProjectListPage>
  );
};

export default CreateProjectListPage;
