import * as _ from 'lodash-es';
import { WebHookSecretKey } from '../../secret';
import { useTranslation } from 'react-i18next';
import { SecretTypeAbstraction, SecretType } from './types';
import { Base64 } from 'js-base64';
import { PullSecretCredential } from './PullSecretCredentialsForm';

export const toDefaultSecretType = (typeAbstraction: SecretTypeAbstraction): SecretType => {
  switch (typeAbstraction) {
    case SecretTypeAbstraction.source:
      return SecretType.basicAuth;
    case SecretTypeAbstraction.image:
      return SecretType.dockerconfigjson;
    default:
      return SecretType.opaque;
  }
};

export const toTypeAbstraction = (secret): SecretTypeAbstraction => {
  const { data, type } = secret;
  switch (type) {
    case SecretType.basicAuth:
    case SecretType.sshAuth:
      return SecretTypeAbstraction.source;
    case SecretType.dockerconfigjson:
    case SecretType.dockercfg:
      return SecretTypeAbstraction.image;
    default:
      if (data?.[WebHookSecretKey] && _.size(data) === 1) {
        return SecretTypeAbstraction.webhook;
      }
      return SecretTypeAbstraction.generic;
  }
};

export const generateSecret = (): string => {
  // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + s4() + s4();
};

export const determineSecretType = (stringData): SecretType => {
  const dataKeys = _.keys(stringData).sort();
  if (_.isEqual(dataKeys, ['tls.crt', 'tls.key'])) {
    return SecretType.tls;
  } else if (_.isEqual(dataKeys, ['ca.crt', 'namespace', 'service-ca.crt', 'token'])) {
    return SecretType.serviceAccountToken;
  } else if (_.isEqual(dataKeys, ['.dockercfg'])) {
    return SecretType.dockercfg;
  } else if (_.isEqual(dataKeys, ['.dockerconfigjson'])) {
    return SecretType.dockerconfigjson;
  } else if (_.isEqual(dataKeys, ['password', 'username'])) {
    return SecretType.basicAuth;
  } else if (_.isEqual(dataKeys, ['ssh-privatekey'])) {
    return SecretType.sshAuth;
  }
  return SecretType.opaque;
};

export const getPullSecretFileName = (secretType: SecretType): string => {
  switch (secretType) {
    case SecretType.dockercfg:
      return '.dockercfg';
    case SecretType.dockerconfigjson:
      return '.dockerconfigjson';
    default:
      return secretType;
  }
};

export const useSecretTitle = (
  isCreate: boolean,
  typeAbstraction: SecretTypeAbstraction,
): string => {
  const { t } = useTranslation();
  switch (typeAbstraction) {
    case SecretTypeAbstraction.generic:
      return isCreate ? t('public~Create key/value secret') : t('public~Edit key/value secret');
    case SecretTypeAbstraction.image:
      return isCreate ? t('public~Create image pull secret') : t('public~Edit image pull secret');
    default:
      return isCreate
        ? t('public~Create {{secretType}} secret', { secretType: typeAbstraction })
        : t('public~Edit {{secretType}} secret', { secretType: typeAbstraction });
  }
};

export const useSecretDescription = (typeAbstraction: SecretTypeAbstraction): string => {
  const { t } = useTranslation();
  switch (typeAbstraction) {
    case SecretTypeAbstraction.generic:
      return t(
        'public~Key/value secrets let you inject sensitive data into your application as files or environment variables.',
      );
    case SecretTypeAbstraction.source:
      return t('public~Source secrets let you authenticate against a Git server.');
    case SecretTypeAbstraction.image:
      return t('public~Image pull secrets let you authenticate against a private image registry.');
    case SecretTypeAbstraction.webhook:
      return t('public~Webhook secrets let you authenticate a webhook trigger.');
    default:
      return null;
  }
};

const isDockerConfigJSONData = (value: PullSecretData): value is DockerConfigJSON =>
  Boolean(value?.auths);

const getDockerConfigData = (pullSecretData: any): DockerCfg =>
  isDockerConfigJSONData(pullSecretData) ? pullSecretData.auths : pullSecretData;

export const arrayifyPullSecret = (
  pullSecretJSON: string,
  onError: (e: any) => void,
): PullSecretCredential[] => {
  try {
    const pullSecretData = pullSecretJSON ? JSON.parse(pullSecretJSON) : {};
    const dockerConfigData = getDockerConfigData(pullSecretData);
    return Object.entries<DockerConfigCredential>(dockerConfigData ?? {}).map(([key, value]) => {
      const decodedAuth = Base64.decode(value?.auth || '');
      const [parsedUsername, parsedPassword] = decodedAuth?.split(':') ?? [];
      return {
        address: key,
        username: parsedUsername || '',
        password: parsedPassword || '',
        email: value?.email || '',
        uid: _.uniqueId(),
      };
    });
  } catch (err) {
    onError(`Error parsing pull secret: ${err.message}`);
    return [];
  }
};

export const stringifyPullSecret = (
  credentials: PullSecretCredential[],
  secretType: SecretType,
): string => {
  const auths = credentials.reduce((acc, { address, username, password, email }) => {
    const auth = username && password ? Base64.encode(`${username}:${password}`) : '';
    return {
      ...acc,
      [address]: {
        ...(auth ? { auth } : {}),
        username,
        password,
        email,
      },
    };
  }, {});
  return secretType === SecretType.dockercfg ? JSON.stringify(auths) : JSON.stringify({ auths });
};

type DockerConfigCredential = {
  username: string;
  password: string;
  email: string;
  auth: string;
};

type DockerConfigJSON = {
  auths: DockerCfg;
};

type DockerCfg = {
  [key: string]: DockerConfigCredential;
};

type PullSecretData = DockerCfg | DockerConfigJSON;
