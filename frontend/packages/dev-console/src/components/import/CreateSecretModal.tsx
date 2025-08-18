import * as React from 'react';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import {
  SecretFormWrapper,
  SecretFormType,
} from '@console/internal/components/secrets/create-secret';

export interface CreateSecretModalProps {
  save?: (name: string) => void;
  namespace: string;
  formType: SecretFormType;
}

type Props = CreateSecretModalProps & ModalComponentProps;

const CreateSecretModal: React.FC<Props> = ({ close, namespace, save, formType }) => {
  const handleSave = (name: string) => {
    close?.();
    save?.(name);
  };

  return (
    <SecretFormWrapper
      onCancel={close}
      onSave={handleSave}
      fixed={{ metadata: { namespace } }}
      formType={formType}
      isCreate
      modal
    />
  );
};

export const secretModalLauncher = createModalLauncher<Props>(CreateSecretModal);

export default CreateSecretModal;
