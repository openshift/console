import { SecretType } from '.';

type Base64EncodedString = string;
export type SecretStringData = { [key: string]: string };
export type Base64StringData = { [key: string]: Base64EncodedString };

export type SecretChangeData = {
  stringData?: SecretStringData;
  base64StringData?: SecretStringData;
};

export type KeyValueEntry = {
  uid?: string;
  isBinary?: boolean;
  entryKey: string;
  entryValue: string;
};

export type SecretSubFormProps = {
  onChange: (data: SecretChangeData) => void;
  onError: (error: any) => void;
  onFormDisable: (disable: boolean) => void;
  stringData: SecretStringData;
  base64StringData: Base64StringData;
  secretType: SecretType;
  isCreate: boolean;
};
