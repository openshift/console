import { useState, useCallback } from 'react';
import { useHelmCreateBasicAuthSecretModal } from './HelmCreateBasicAuthSecretModal';

const CREATE_SECRET_KEY = 'create-secret';
const NONE_SECRET_KEY = '__none__';

export { CREATE_SECRET_KEY, NONE_SECRET_KEY };

interface UseBasicAuthSecretDropdownOptions {
  namespace: string;
  currentSecretName: string;
  setFieldValue: (field: string, value: string) => void;
  supportNone?: boolean;
}

export const useBasicAuthSecretDropdown = ({
  namespace,
  currentSecretName,
  setFieldValue,
  supportNone = false,
}: UseBasicAuthSecretDropdownOptions) => {
  const launchModal = useHelmCreateBasicAuthSecretModal();
  const [isCreateSecretModalOpen, setIsCreateSecretModalOpen] = useState(false);

  const handleSecretChange = useCallback(
    (key: string) => {
      if (supportNone && key === NONE_SECRET_KEY) {
        window.setTimeout(() => setFieldValue('basicAuthSecretName', NONE_SECRET_KEY), 0);
        return;
      }
      if (key === CREATE_SECRET_KEY && !isCreateSecretModalOpen) {
        window.setTimeout(() => setFieldValue('basicAuthSecretName', currentSecretName || ''), 0);
        setIsCreateSecretModalOpen(true);
        launchModal({
          namespace,
          save: (name) => {
            setFieldValue('basicAuthSecretName', name);
            setIsCreateSecretModalOpen(false);
          },
          onClose: () => setIsCreateSecretModalOpen(false),
        });
      }
    },
    [
      supportNone,
      isCreateSecretModalOpen,
      launchModal,
      namespace,
      currentSecretName,
      setFieldValue,
    ],
  );

  return { handleSecretChange };
};
