import * as _ from 'lodash-es';
import { WebHookSecretKey } from '../../secret';
import { SecretTypeAbstraction, SecretType } from '.';
import { useTranslation } from 'react-i18next';

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
