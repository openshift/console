export type SecretStringData = { [key: string]: string };

export type SecretChangeData = {
  stringData: SecretStringData;
  base64StringData?: SecretStringData;
};
