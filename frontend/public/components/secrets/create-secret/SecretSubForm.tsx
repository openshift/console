import * as React from 'react';
import {
  SourceSecretForm,
  SecretTypeAbstraction,
  ImageSecretForm,
  WebHookSecretForm,
  GenericSecretForm,
  SecretType,
} from '.';

export const SecretSubForm: React.FC<SecretSubFormProps> = ({ typeAbstraction, ...props }) => {
  switch (typeAbstraction) {
    case SecretTypeAbstraction.source:
      return <SourceSecretForm {...props} />;
    case SecretTypeAbstraction.image:
      return <ImageSecretForm {...props} />;
    case SecretTypeAbstraction.webhook:
      return <WebHookSecretForm {...props} />;
    default:
      return <GenericSecretForm {...props} />;
  }
};

type SecretSubFormProps = {
  typeAbstraction: SecretTypeAbstraction;
  onChange: (param: any) => void;
  onError: (param: any) => void;
  onFormDisable: (param: boolean) => void;
  stringData: { [key: string]: string };
  secretType: SecretType;
  isCreate: boolean;
};
