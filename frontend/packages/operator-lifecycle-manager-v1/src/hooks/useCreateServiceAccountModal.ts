import { useCallback } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { CreateServiceAccountModalProps } from '../components/cluster-extension/CreateServiceAccountModal';
import { CreateServiceAccountModal } from '../components/cluster-extension/CreateServiceAccountModal';

export const useCreateServiceAccountModal: UseCreateServiceAccountModal = () => {
  const launcher = useOverlay();
  return useCallback((props) => launcher(CreateServiceAccountModal, props), [launcher]);
};

type UseCreateServiceAccountModal = () => (props: CreateServiceAccountModalProps) => void;
