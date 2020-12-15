import * as React from 'react';
import {
  withSecretForm,
  ImageSecretForm,
  SourceSecretForm,
  SecretTypeAbstraction,
} from '@console/internal/components/secrets/create-secret';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';

export interface CreateSecretModalProps {
  save?: (name: string) => void;
  namespace: string;
  secretType: SecretTypeAbstraction;
}

type Props = CreateSecretModalProps & ModalComponentProps;

const getSecretForm = (type: SecretTypeAbstraction) => {
  switch (type) {
    case SecretTypeAbstraction.source:
      return withSecretForm(SourceSecretForm, true);
    case SecretTypeAbstraction.image:
      return withSecretForm(ImageSecretForm, true);
    default:
      return null;
  }
};

const CreateSecretModal: React.FC<Props> = ({ close, namespace, save, secretType }) => {
  const handleSave = (name: string) => {
    close();
    save(name);
  };

  const CreateSecretForm = getSecretForm(secretType);
  return (
    <CreateSecretForm
      onCancel={close}
      onSave={handleSave}
      fixed={{ metadata: { namespace } }}
      secretTypeAbstraction={secretType}
      titleVerb="Create"
      isCreate
    />
  );
};

export const secretModalLauncher = createModalLauncher<Props>(CreateSecretModal);

export default CreateSecretModal;
