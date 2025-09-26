import { FCC } from 'react';
import { SecretSubFormProps, SecretFormType } from './types';
import { AuthSecretForm } from './AuthSecretForm';
import { PullSecretForm } from './PullSecretForm';
import { WebHookSecretForm } from './WebHookSecretForm';
import { OpaqueSecretForm } from './OpaqueSecretForm';

export const SecretSubForm: FCC<SecretSubFormProps & { formType: SecretFormType }> = ({
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
