import * as React from 'react';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { CreateNamespaceModal } from '../components/modals/CreateNamespaceModal';
import { CreateProjectModalProps } from '../components/modals/CreateProjectModal';

export const useCreateNamespaceModal: UseCreateNamespaceModal = () => {
  const launcher = useModal();
  return React.useCallback((props) => launcher(CreateNamespaceModal, props), [launcher]);
};

type UseCreateNamespaceModal = () => (props: CreateProjectModalProps) => void;
