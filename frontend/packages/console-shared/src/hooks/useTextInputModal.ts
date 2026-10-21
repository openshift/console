import { useCallback } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { TextInputModalProps } from '../components/modals/TextInputModal';
import { TextInputModal } from '../components/modals/TextInputModal';

export const useTextInputModal: UseTextInputModal = () => {
  const launcher = useOverlay();
  return useCallback((props) => launcher(TextInputModal, props), [launcher]);
};

type UseTextInputModal = () => (props: TextInputModalProps) => void;
