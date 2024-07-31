import * as React from 'react';
import { DockerConfigCredential, DockerConfigData, PullSecretData } from './PullSecretForm';
import { Base64 } from 'js-base64';
import * as _ from 'lodash-es';
import { PullSecretCredential } from './PullSecretCredentialsForm';

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
  stringData: string,
  onChange: (changeData: PullSecretData) => void,
  onError: (error: any) => void,
): any => {
  let dockerConfigData;
  try {
    dockerConfigData = JSON.parse(stringData);
  } catch (err) {
    dockerConfigData = {};
    onError(`Error parsing secret's data: ${err.message}`);
  }
  const initialEntries = dockerConfigDataToPullSecretCredentials(dockerConfigData);
  const [entries, setEntries] = React.useState(initialEntries);

  React.useEffect(() => {
    const newSecretData = pullSecretCredentialsToDockerConfigData(entries);
    onChange(newSecretData);
  }, [entries]);

  return [entries, setEntries];
};
