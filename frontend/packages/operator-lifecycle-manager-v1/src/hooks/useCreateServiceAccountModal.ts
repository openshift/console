import { useCallback } from 'react';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import {
  CreateServiceAccountModal,
  CreateServiceAccountModalProps,
} from '../components/cluster-extension/CreateServiceAccountModal';

export const useCreateServiceAccountModal: UseCreateServiceAccountModal = () => {
  const launcher = useModal();
  return useCallback((props) => launcher(CreateServiceAccountModal, props), [launcher]);
};

type UseCreateServiceAccountModal = () => (props: CreateServiceAccountModalProps) => void;
