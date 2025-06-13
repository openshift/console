import { SecretType } from '.';

export type SecretStringData = Record<string, string>;
export type Base64StringData = Record<string, string>;

type SecretChangeData = {
  stringData: SecretStringData;
  base64StringData?: SecretStringData;
};

export type KeyValueEntryFormState = {
  isBinary_?: boolean;
  key: string;
  value: string;
};

export type KeyValueEntryFormProps = {
  entry: KeyValueEntryFormState;
  id: number;
  onChange: Function;
};

export type SecretSubFormProps = {
  onChange: (stringData: SecretChangeData) => void;
  onError: (error: any) => void;
  onFormDisable: (disable: boolean) => void;
  stringData: SecretStringData;
  base64StringData: Base64StringData;
  secretType: SecretType;
  isCreate: boolean;
};
