import { SecretType } from '.';

export type SecretStringData = { [key: string]: string };

type SecretChangeData = {
  stringData: SecretStringData;
  base64StringData?: SecretStringData;
};

export type KeyValueEntryFormState = {
  isBase64?: boolean;
  isBinary?: boolean;
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
  secretType: SecretType;
  isCreate: boolean;
};
