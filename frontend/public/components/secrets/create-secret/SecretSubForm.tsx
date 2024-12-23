import * as React from 'react';
import { SecretSubFormProps, SecretTypeAbstraction } from './types';
import { AuthSecretForm } from './AuthSecretForm';
import { PullSecretForm } from './PullSecretForm';
import { WebHookSecretForm } from './WebHookSecretForm';
import { GenericSecretForm } from './GenericSecretForm';

export const SecretSubForm: React.FC<
  SecretSubFormProps & { typeAbstraction: SecretTypeAbstraction }
> = ({ typeAbstraction, ...props }) => {
  switch (typeAbstraction) {
    case SecretTypeAbstraction.source:
      return <AuthSecretForm {...props} />;
    case SecretTypeAbstraction.image:
      return <PullSecretForm {...props} />;
    case SecretTypeAbstraction.webhook:
      return <WebHookSecretForm {...props} />;
    default:
      return <GenericSecretForm {...props} />;
  }
};
