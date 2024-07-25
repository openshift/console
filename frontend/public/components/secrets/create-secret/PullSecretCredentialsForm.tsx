import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { AUTHS_KEY, PullSecretCredentialEntry, PullSecretData } from '.';

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

export const PullSecretCredentialsForm: React.FC<PullSecretCredentialsFormProps> = ({
  onChange,
  pullSecretData,
}) => {
  const { t } = useTranslation();
  const isDockerconfigjson = _.isEmpty(pullSecretData) || !!pullSecretData[AUTHS_KEY];

  const secretEntriesArray = React.useMemo<PullSecretCredential[]>(() => {
    return pullSecretDataToPullSecretCrentialArray(pullSecretData?.[AUTHS_KEY] || pullSecretData);
  }, [pullSecretData]);

  const onEntriesChanged = (secretEntries: PullSecretCredential[]) => {
    const imageSecretObject = PullSecretCrentialArrayToPullSecretData(secretEntries);
    onChange(isDockerconfigjson ? { [AUTHS_KEY]: imageSecretObject } : imageSecretObject);
  };

  const updateEntry = (updatedEntry, entryIndex: number) => {
    const updatedSecretEntriesArray = secretEntriesArray.map((entry, index) => {
      if (index === entryIndex) {
        return {
          uid: entry.uid,
          ...updatedEntry,
        };
      }
      return entry;
    });
    onEntriesChanged(updatedSecretEntriesArray);
  };

  const removeEntry = (entryIndex: number) => {
    const updatedSecretEntriesArray = secretEntriesArray.filter(
      (value, index) => index !== entryIndex,
    );
    onEntriesChanged(updatedSecretEntriesArray);
  };

  const addEntry = () => {
    const updatedSecretsEntriesArray = [...secretEntriesArray, newImageSecretEntry()];
    onEntriesChanged(updatedSecretsEntriesArray);
  };

  return (
    <>
      {secretEntriesArray.map(({ uid, address, email, username, password }, index) => (
        <div className="co-add-remove-form__entry" key={uid}>
          {secretEntriesArray.length > 1 && (
            <div className="co-add-remove-form__link--remove-entry">
              <Button
                onClick={() => removeEntry(index)}
                type="button"
                variant="link"
                data-test="remove-entry-button"
              >
                <MinusCircleIcon className="co-icon-space-r" />
                {t('public~Remove credentials')}
              </Button>
            </div>
          )}
          <PullSecretCredentialEntry
            id={index}
            address={address}
            email={email}
            password={password}
            username={username}
            onChange={updateEntry}
          />
        </div>
      ))}
      <Button
        className="co-create-secret-form__link--add-entry pf-m-link--align-left"
        onClick={addEntry}
        type="button"
        variant="link"
        data-test="add-credentials-button"
      >
        <PlusCircleIcon className="co-icon-space-r" />
        {t('public~Add credentials')}
      </Button>
    </>
  );
};

type PullSecretCredential = {
  address: string;
  username: string;
  password: string;
  email: string;
  auth: string;
  uid: string;
};

type PullSecretCredentialsFormProps = {
  onChange: (secretData: PullSecretData) => void;
  pullSecretData: PullSecretData;
};
