import { useCallback } from 'react';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { TextInputModal, TextInputModalProps } from '../components/modals/TextInputModal';

export const useTextInputModal: UseTextInputModal = () => {
  const launcher = useModal();
  return useCallback((props) => launcher(TextInputModal, props), [launcher]);
};

type UseTextInputModal = () => (props: TextInputModalProps) => void;
