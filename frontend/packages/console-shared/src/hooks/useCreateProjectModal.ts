import { useCallback } from 'react';
import type { CreateProjectModalProps } from '@console/dynamic-plugin-sdk/src';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { CreateProjectModal } from '../components/modals/CreateProjectModal';

export const useCreateProjectModal: UseCreateProjectModal = () => {
  const launchModal = useOverlay();
  return useCallback((props) => launchModal(CreateProjectModal, props), [launchModal]);
};

type UseCreateProjectModal = () => (props: CreateProjectModalProps) => void;
