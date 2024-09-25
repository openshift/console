import * as React from 'react';
import { SourceSecretForm, PullSecretForm, WebHookSecretForm, GenericSecretForm } from '.';
import { SecretSubFormProps, SecretTypeAbstraction } from './types';

export const SecretSubForm: React.FC<
  SecretSubFormProps & { typeAbstraction: SecretTypeAbstraction }
> = ({ typeAbstraction, ...props }) => {
  switch (typeAbstraction) {
    case SecretTypeAbstraction.source:
      return <SourceSecretForm {...props} />;
    case SecretTypeAbstraction.image:
      return <PullSecretForm {...props} />;
    case SecretTypeAbstraction.webhook:
      return <WebHookSecretForm {...props} />;
    default:
      return <GenericSecretForm {...props} />;
  }
};
