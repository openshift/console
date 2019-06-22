import * as React from 'react';
import {
  withSecretForm,
  SourceSecretForm,
  SecretTypeAbstraction,
} from '@console/internal/components/secrets/create-secret';
import { createModalLauncher } from '@console/internal/components/factory/modal';

interface CreateSourceSecretModalProps {
  cancel: (e: MouseEvent) => void;
  close: () => void;
  onSave?: (name: string) => void;
  namespace: string;
}

const CreateSourceSecretModal: React.FC<CreateSourceSecretModalProps> = ({
  close,
  namespace,
  onSave,
}) => {
  const CreateSourceSecretForm = withSecretForm(SourceSecretForm, true);
  const handleSave = (name: string) => {
    close();
    onSave(name);
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

export const sourceSecretModalLauncher = createModalLauncher<CreateSourceSecretModalProps>(
  CreateSourceSecretModal,
);
