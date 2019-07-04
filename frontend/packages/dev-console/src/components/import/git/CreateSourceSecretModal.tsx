import * as React from 'react';
import {
  withSecretForm,
  SourceSecretForm,
  SecretTypeAbstraction,
} from '@console/internal/components/secrets/create-secret';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';

export interface CreateSourceSecretModalProps {
  save?: (name: string) => void;
  namespace: string;
}

type Props = CreateSourceSecretModalProps & ModalComponentProps;

const CreateSourceSecretForm = withSecretForm(SourceSecretForm, true);

const CreateSourceSecretModal: React.FC<Props> = ({ close, namespace, save }) => {
  const handleSave = (name: string) => {
    close();
    save(name);
  };
  return (
    <CreateSourceSecretForm
      onCancel={close}
      onSave={handleSave}
      fixed={{ metadata: { namespace } }}
      secretTypeAbstraction={SecretTypeAbstraction.source}
      explanation="Source secrets let you authenticate against a Git server."
      titleVerb="Create"
      isCreate
    />
  );
};

export const sourceSecretModalLauncher = createModalLauncher<Props>(CreateSourceSecretModal);

export default CreateSourceSecretModal;
