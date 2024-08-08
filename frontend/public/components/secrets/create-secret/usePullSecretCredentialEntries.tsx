import * as React from 'react';
import { Base64 } from 'js-base64';
import * as _ from 'lodash-es';
import { PullSecretCredential } from './PullSecretCredentialsForm';
import { getPullSecretFileName, SecretChangeData, SecretStringData, SecretType } from '.';

const newImageSecretEntry = (): PullSecretCredential => ({
  address: '',
  username: '',
  password: '',
  email: '',
  auth: '',
  uid: _.uniqueId(),
});

const dockerConfigDataToPullSecretCredentials = (
  dockerConfigData: DockerConfigData,
): PullSecretCredential[] => {
  const entries = Object.entries<DockerConfigCredential>(dockerConfigData ?? {}).map(
    ([key, value]) => {
      const decodedAuth = Base64.decode(value?.auth || '');
      const [parsedUsername, parsedPassword] = decodedAuth?.split(':') ?? [];
      return {
        address: key,
        username: parsedUsername || '',
        password: parsedPassword || '',
        email: value?.email || '',
        uid: _.uniqueId(),
      };
    },
  );
  return entries.length ? entries : [newImageSecretEntry()];
};

const pullSecretCredentialsToDockerConfigData = (
  pullSecretCredentials: PullSecretCredential[],
): DockerConfigData =>
  pullSecretCredentials.reduce((acc, { address, username, password, email }) => {
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

export const usePullSecretCredentialEntries = (
  secretType: SecretType,
  stringData: SecretStringData,

  onChange: (stringData: SecretChangeData) => void,
  onError: (error: any) => void,
): [PullSecretCredential[], React.Dispatch<React.SetStateAction<PullSecretCredential[]>>] => {
  const fileName = getPullSecretFileName(secretType);
  const isDockerConfigJSONData = (value: PullSecretData): value is DockerConfigData =>
    Boolean(value?.auths);
  const getDockerConfigData = (pullSecretData: any): DockerConfigData =>
    isDockerConfigJSONData(pullSecretData) ? pullSecretData.auths : pullSecretData;
  const initialEntries = React.useMemo<PullSecretCredential[]>(() => {
    try {
      const jsonContent = stringData[fileName] ?? '{}';
      const pullSecretData: PullSecretData = JSON.parse(jsonContent);
      const dockerConfigData = getDockerConfigData(pullSecretData);
      return dockerConfigDataToPullSecretCredentials(dockerConfigData);
    } catch (err) {
      onError(`Error parsing pull secret: ${err.message}`);
      return [];
    }
  }, [stringData]);
  const [entries, setEntries] = React.useState(initialEntries);

  React.useEffect(() => {
    const newSecretData = pullSecretCredentialsToDockerConfigData(entries);
    onChange({
      stringData: {
        [fileName]: JSON.stringify(newSecretData),
      },
    });
  }, [entries]);

  return [entries, setEntries];
};

export type DockerConfigCredential = {
  username: string;
  password: string;
  email: string;
  auth: string;
};

export type DockerConfigData = {
  [url: string]: DockerConfigCredential;
};

type DockerConfigJSONData = {
  auths: DockerConfigData;
};

export type PullSecretData = DockerConfigData | DockerConfigJSONData;
