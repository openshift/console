import * as React from 'react';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import {
  SecretFormWrapper,
  SecretTypeAbstraction,
} from '@console/internal/components/secrets/create-secret';

export interface CreateSecretModalProps {
  save?: (name: string) => void;
  namespace: string;
  secretType: SecretTypeAbstraction;
}

type Props = CreateSecretModalProps & ModalComponentProps;

const CreateSecretModal: React.FC<Props> = ({ close, namespace, save, secretType }) => {
  const handleSave = (name: string) => {
    close();
    save(name);
  };

  return (
    <SecretFormWrapper
      onCancel={close}
      onSave={handleSave}
      fixed={{ metadata: { namespace } }}
      secretTypeAbstraction={secretType}
      isCreate
      modal
    />
  );
};

export const secretModalLauncher = createModalLauncher<Props>(CreateSecretModal);

export default CreateSecretModal;
