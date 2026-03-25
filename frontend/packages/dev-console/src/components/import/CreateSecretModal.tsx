import { useCallback } from 'react';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { SecretFormType } from '@console/internal/components/secrets/create-secret';
import { SecretFormWrapper } from '@console/internal/components/secrets/create-secret';

export interface CreateSecretModalProps {
  namespace: string;
  formType: SecretFormType;
  save?: (name: string) => void;
}

const CreateSecretModal: OverlayComponent<CreateSecretModalProps> = ({
  closeOverlay,
  namespace,
  save,
  formType,
}) => {
  const handleSave = (name: string) => {
    closeOverlay();
    save?.(name);
  };

  return (
    <SecretFormWrapper
      onCancel={closeOverlay}
      onSave={handleSave}
      fixed={{ metadata: { namespace } }}
      formType={formType}
      isCreate
      modal
    />
  );
};

export type CreateSecretCallbackWithProps = (props?: CreateSecretModalProps) => void;

export const useCreateSecretModal = (): CreateSecretCallbackWithProps => {
  const launcher = useOverlay();

  return useCallback((props) => launcher(CreateSecretModal, props), [launcher]);
};
