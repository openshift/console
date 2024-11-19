import * as React from 'react';
import { SecretSubFormProps } from './types';
import { SecretTypeAbstraction } from './const';
import { SourceSecretForm } from './SourceSecretForm';
import { PullSecretForm } from './PullSecretForm';
import { WebHookSecretForm } from './WebHookSecretForm';
import { GenericSecretForm } from './GenericSecretForm';

export const SecretSubForm: React.FC<WithTypeAbstraction<SecretSubFormProps>> = ({
  typeAbstraction,
  ...props
}) => {
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

type WithTypeAbstraction<T> = T & {
  typeAbstraction: SecretTypeAbstraction;
};
