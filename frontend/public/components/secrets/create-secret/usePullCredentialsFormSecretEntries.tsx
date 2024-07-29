import * as React from 'react';
import { PullSecretData } from './PullSecretForm';
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

const pullSecretDataToPullSecretCrentialArray = (imageSecretObject): PullSecretCredential[] => {
  const entries = Object.entries(imageSecretObject ?? {}).map(([key, value]) => {
    const decodedAuth = Base64.decode(_.get(value, 'auth', ''));
    const parsedAuth = _.isEmpty(decodedAuth) ? _.fill(Array(2), '') : _.split(decodedAuth, ':');
    return {
      address: key,
      username: _.get(value, 'username', parsedAuth[0]),
      password: _.get(value, 'password', parsedAuth[1]),
      email: _.get(value, 'email', ''),
      auth: _.get(value, 'auth', ''),
      uid: _.get(value, 'uid', _.uniqueId()),
    };
  });
  return entries.length ? entries : [newImageSecretEntry()];
};

const PullSecretCrentialArrayToPullSecretData = (imageSecretArray: PullSecretCredential[]) => {
  const imageSecretsObject = imageSecretArray.reduce((acc, value) => {
    acc[value.address] = {
      username: value.username,
      password: value.password,
      auth: value.auth,
      email: value.email,
    };
    return acc;
  }, {});
  return imageSecretsObject;
};

export const usePullCredentialsFormSecretEntries = (
  pullSecretData: any,
  onChange: (changeData: PullSecretData) => void,
): any => {
  const initialEntries = pullSecretDataToPullSecretCrentialArray(pullSecretData);
  const [entries, setEntries] = React.useState(initialEntries);

  React.useEffect(() => {
    const newSecretData = PullSecretCrentialArrayToPullSecretData(entries);
    onChange(newSecretData);
  }, [entries]);

  return [entries, setEntries];
};
