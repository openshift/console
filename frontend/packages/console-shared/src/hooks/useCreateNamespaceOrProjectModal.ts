import * as React from 'react';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/flag';
import { CreateNamespaceModal } from '../components/modals/CreateNamespaceModal';
import {
  CreateProjectModal,
  CreateProjectModalProps,
} from '../components/modals/CreateProjectModal';

export const useCreateNamespaceOrProjectModal: UseCreateProjectModal = () => {
  const launcher = useModal();
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);
  const ModalComponent = isOpenShift ? CreateProjectModal : CreateNamespaceModal;
  return React.useCallback((props) => launcher(ModalComponent, props), [launcher, ModalComponent]);
};

type UseCreateProjectModal = () => (props: CreateProjectModalProps) => void;
