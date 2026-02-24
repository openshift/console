import { useCallback } from 'react';
import type { CreateProjectModalProps } from '@console/dynamic-plugin-sdk/src';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { CreateNamespaceModal } from '../components/modals/CreateNamespaceModal';

export const useCreateNamespaceModal: UseCreateNamespaceModal = () => {
  const launchModal = useOverlay();
  return useCallback((props) => launchModal(CreateNamespaceModal, props), [launchModal]);
};

type UseCreateNamespaceModal = () => (props: CreateProjectModalProps) => void;
