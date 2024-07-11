import * as React from 'react';
import { CreateProjectModalProps } from '@console/dynamic-plugin-sdk/src';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { CreateNamespaceModal } from '../components/modals/CreateNamespaceModal';

export const useCreateNamespaceModal: UseCreateNamespaceModal = () => {
  const launcher = useModal();
  return React.useCallback((props) => launcher(CreateNamespaceModal, props), [launcher]);
};

type UseCreateNamespaceModal = () => (props: CreateProjectModalProps) => void;
