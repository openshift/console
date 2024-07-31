import * as React from 'react';
import { DockerConfigCredential, DockerConfigData, PullSecretData } from './PullSecretForm';
import { Base64 } from 'js-base64';
import * as _ from 'lodash-es';
import { PullSecretCredential } from './PullSecretCredentialsForm';
import { getImageSecretKey, SecretStringData, SecretType } from '.';

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
        username: parsedUsername,
        password: parsedPassword,
        email: value?.email || '',
        auth: value?.auth,
        uid: _.uniqueId(),
      };
    },
  );
  return entries.length ? entries : [newImageSecretEntry()];
};

const pullSecretCredentialsToDockerConfigData = (
  pullSecretCredentials: PullSecretCredential[],
): DockerConfigData =>
  pullSecretCredentials.reduce(
    (acc, { address, ...entry }) => ({
      ...acc,
      [address]: entry,
    }),
    {},
  );

export const usePullSecretCredentialEntries = (
  stringData: SecretStringData,
  onChange: (changeData: PullSecretData) => void,
  onError: (error: any) => void,
  secretType: SecretType,
): [PullSecretCredential[], React.Dispatch<React.SetStateAction<PullSecretCredential[]>>] => {
  const initialEntries = React.useMemo(() => {
    try {
      const key = getImageSecretKey(secretType);
      const jsonContent = stringData[key] ?? '{}';
      const dockerConfigData = JSON.parse(jsonContent);
      return dockerConfigDataToPullSecretCredentials(dockerConfigData?.auths || dockerConfigData);
    } catch (err) {
      onError(`Error parsing pull secret: ${err.message}`);
      return [];
    }
  }, [stringData]);
  const [entries, setEntries] = React.useState(initialEntries);

  React.useEffect(() => {
    const newSecretData = pullSecretCredentialsToDockerConfigData(entries);
    onChange(newSecretData);
  }, [entries]);

  return [entries, setEntries];
};
