import type { FC } from 'react';
import { AuthSecretForm } from './AuthSecretForm';
import { OpaqueSecretForm } from './OpaqueSecretForm';
import { PullSecretForm } from './PullSecretForm';
import type { SecretSubFormProps } from './types';
import { SecretFormType } from './types';
import { WebHookSecretForm } from './WebHookSecretForm';

export const SecretSubForm: FC<SecretSubFormProps & { formType: SecretFormType }> = ({
  formType,
  ...props
}) => {
  switch (formType) {
    case SecretFormType.source:
      return <AuthSecretForm {...props} />;
    case SecretFormType.image:
      return <PullSecretForm {...props} />;
    case SecretFormType.webhook:
      return <WebHookSecretForm {...props} />;
    default:
      return <OpaqueSecretForm {...props} />;
  }
};
