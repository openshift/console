import * as React from 'react';
import {
  SourceSecretForm,
  SecretTypeAbstraction,
  PullSecretForm,
  WebHookSecretForm,
  GenericSecretForm,
} from '.';
import { SecretSubFormProps } from './types';

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
