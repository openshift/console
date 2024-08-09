import * as React from 'react';
import {
  SourceSecretForm,
  SecretTypeAbstraction,
  PullSecretForm,
  WebHookSecretForm,
  GenericSecretForm,
  SecretType,
} from '.';

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
export type SecretSubFormProps = {
  onChange: OnSecretChange;
  onError?: (error: any) => void;
  onFormDisable?: (disable: boolean) => void;
  stringData: SecretStringData;
  secretType?: SecretType;
  isCreate?: boolean;
};

export type SecretChangeData = {
  stringData: SecretStringData;
  base64StringData?: SecretStringData;
};
export type SecretStringData = { [key: string]: string };

export type OnSecretChange = (stringData: SecretChangeData) => void;
