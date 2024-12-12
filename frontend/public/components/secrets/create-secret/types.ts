export enum SecretTypeAbstraction {
  generic = 'generic',
  source = 'source',
  image = 'image',
  webhook = 'webhook',
}

export enum SecretType {
  basicAuth = 'kubernetes.io/basic-auth',
  dockercfg = 'kubernetes.io/dockercfg',
  dockerconfigjson = 'kubernetes.io/dockerconfigjson',
  opaque = 'Opaque',
  serviceAccountToken = 'kubernetes.io/service-account-token',
  sshAuth = 'kubernetes.io/ssh-auth',
  tls = 'kubernetes.io/tls',
}

export type SecretSubFormProps = {
  onChange: OnSecretChange;
  onError?: (error: any) => void;
  onFormDisable?: (disable: boolean) => void;
  stringData: SecretStringData;
  secretType?: SecretType;
  isCreate?: boolean;
};

type SecretChangeData = {
  stringData?: SecretStringData;
  base64StringData?: SecretStringData;
};
export type SecretStringData = { [key: string]: string };

export type OnSecretChange = (stringData: SecretChangeData) => void;

export type PullSecretCredential = {
  address: string;
  username: string;
  password: string;
  email: string;
  auth?: string;
  uid: string;
};

export type KeyValueEntry = {
  isBase64?: boolean;
  isBinary?: boolean;
  key: string;
  value: string;
};
