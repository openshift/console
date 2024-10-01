// TODO Follow on: Move Type definitions for CreateSecret here

export type SecretStringData = { [key: string]: string };

export type SecretChangeData = { stringData: SecretStringData; base64StringData: SecretStringData };

export type SSHAuthSubformProps = {
  onChange: (stringData: SecretChangeData) => void;
  stringData: SecretStringData;
};
