import { useCallback } from 'react';
import type { CreateProjectModalProps } from '@console/dynamic-plugin-sdk/src';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/flag';
import { CreateNamespaceModal } from '../components/modals/CreateNamespaceModal';
import { CreateProjectModal } from '../components/modals/CreateProjectModal';

export const useCreateNamespaceOrProjectModal: UseCreateProjectModal = () => {
  const launchModal = useOverlay();
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);
  const ModalComponent = isOpenShift ? CreateProjectModal : CreateNamespaceModal;
  return useCallback((props) => launchModal(ModalComponent, props), [launchModal, ModalComponent]);
};

type UseCreateProjectModal = () => (props: CreateProjectModalProps) => void;
