import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { WebHookSecretKey } from './const';
import {
  SecretFormType,
  SecretFilterValues,
  SecretType,
  PullSecretCredential,
  Base64StringData,
  OpaqueDataEntry,
  SecretChangeData,
} from './types';
import { isBinary } from 'istextorbinary';
import { Base64 } from 'js-base64';

export const toDefaultSecretType = (formType: SecretFormType): SecretType => {
  switch (formType) {
    case SecretFormType.source:
      return SecretType.basicAuth;
    case SecretFormType.image:
      return SecretType.dockerconfigjson;
    default:
      return SecretType.opaque;
  }
};

export const toSecretFormType = (secret): SecretFormType => {
  const { data, type } = secret;
  switch (type) {
    case SecretType.basicAuth:
    case SecretType.sshAuth:
      return SecretFormType.source;
    case SecretType.dockerconfigjson:
    case SecretType.dockercfg:
      return SecretFormType.image;
    default:
      if (data?.[WebHookSecretKey] && _.size(data) === 1) {
        return SecretFormType.webhook;
      }
      return SecretFormType.generic;
  }
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
  } else if (dataKeys.includes('password')) {
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

export const useSecretTitle = (isCreate: boolean, formType: SecretFormType): string => {
  const { t } = useTranslation();
  switch (formType) {
    case SecretFormType.generic:
      return isCreate ? t('public~Create key/value secret') : t('public~Edit key/value secret');
    case SecretFormType.image:
      return isCreate ? t('public~Create image pull secret') : t('public~Edit image pull secret');
    default:
      return isCreate
        ? t('public~Create {{formType}} secret', { formType })
        : t('public~Edit {{formType}} secret', { formType });
  }
};

export const useSecretDescription = (formType: SecretFormType): string => {
  const { t } = useTranslation();
  switch (formType) {
    case SecretFormType.generic:
      return t(
        'public~Key/value secrets let you inject sensitive data into your application as files or environment variables.',
      );
    case SecretFormType.source:
      return t('public~Source secrets let you authenticate against a Git server.');
    case SecretFormType.image:
      return t('public~Image pull secrets let you authenticate against a private image registry.');
    case SecretFormType.webhook:
      return t('public~Webhook secrets let you authenticate a webhook trigger.');
    default:
      return null;
  }
};

const isDockerConfigJSONData = (value: PullSecretData): value is DockerConfigJSON =>
  Boolean(value?.auths);

const getDockerConfigData = (pullSecretData: any): DockerCfg =>
  isDockerConfigJSONData(pullSecretData) ? pullSecretData.auths : pullSecretData;

export const newPullSecretCredential = (): PullSecretCredential => ({
  address: '',
  username: '',
  password: '',
  email: '',
  uid: _.uniqueId(),
});

export const arrayifyPullSecret = (
  pullSecretJSON: string,
  onError: (e: any) => void,
): PullSecretCredential[] => {
  try {
    const pullSecretData = pullSecretJSON ? JSON.parse(pullSecretJSON) : {};
    const dockerConfigData = getDockerConfigData(pullSecretData);
    const credentials = Object.entries<DockerConfigCredential>(dockerConfigData ?? {}).map(
      ([key, { auth, email, password, username }]) => {
        const decodedAuth = Base64.decode(auth || '');
        const [parsedUsername, parsedPassword] = decodedAuth?.split(':') ?? [];
        return {
          address: key,
          username: parsedUsername || username || '',
          password: parsedPassword || password || '',
          email: email || '',
          uid: _.uniqueId(),
        };
      },
    );
    return credentials.length > 0 ? credentials : [newPullSecretCredential()];
  } catch (err) {
    onError(`Error parsing pull secret: ${err.message}`);
    return [newPullSecretCredential()];
  }
};

export const stringifyPullSecret = (
  credentials: PullSecretCredential[],
  secretType: SecretType,
): string => {
  const auths = (credentials ?? []).reduce((acc, { address, username, password, email }) => {
    if (!address) {
      return acc;
    }
    const auth = username && password ? Base64.encode(`${username}:${password}`) : '';
    return {
      ...acc,
      [address]: {
        ...(auth ? { auth } : {}),
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
        ...(email ? { email } : {}),
      },
    };
  }, {});
  if (Object.keys(auths).length === 0) {
    return '';
  }
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

export const opaqueEntriesToObject = (
  opaqueEntriesArray: OpaqueDataEntry[] = [],
): SecretChangeData => {
  return opaqueEntriesArray.reduce(
    (acc, { key, value }) => {
      return {
        base64StringData: { ...acc.base64StringData, [key]: value },
      };
    },
    { base64StringData: {} },
  );
};

export const newOpaqueSecretEntry = (): OpaqueDataEntry => {
  return {
    key: '',
    value: '',
    isBinary_: false,
    uid: _.uniqueId(),
  };
};

export const opaqueSecretObjectToArray = (
  base64StringData: Base64StringData,
): OpaqueDataEntry[] => {
  if (_.isEmpty(base64StringData)) {
    return [newOpaqueSecretEntry()];
  }
  return Object.entries(base64StringData).map(([key, value]) => {
    return {
      key,
      value,
      isBinary_: isBinary(null, Buffer.from(value || '', 'base64')),
      uid: _.uniqueId(),
    };
  });
};

export const secretTypeFilterReducer = (secret: { type: SecretType }): string => {
  switch (secret.type) {
    case SecretType.dockercfg:
    case SecretType.dockerconfigjson:
      return SecretFilterValues.image;

    case SecretType.basicAuth:
    case SecretType.sshAuth:
      return SecretFilterValues.source;

    case SecretType.tls:
      return SecretFilterValues.tls;

    case SecretType.serviceAccountToken:
      return SecretFilterValues.sa;

    default:
      // This puts all unrecognized types under "Opaque". Since unrecognized types should be uncommon,
      // it avoids an "Other" category that is usually empty.
      return SecretFilterValues.opaque;
  }
};
