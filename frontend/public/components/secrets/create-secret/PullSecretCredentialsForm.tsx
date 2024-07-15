import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { AUTHS_KEY, PullSecretCredentialEntry, PullSecretData } from '.';
import { useEffect, useState } from 'react';

export const PullSecretCredentialsForm: React.FC<PullSecretCredentialsFormProps> = ({
  onChange,
  stringData,
}) => {
  const { t } = useTranslation();
  const isDockerconfigjson = _.isEmpty(stringData) || !!stringData[AUTHS_KEY];
  const newImageSecretEntry = (): SecretEntry => ({
    entry: {
      address: '',
      username: '',
      password: '',
      email: '',
      auth: '',
    },
    uid: _.uniqueId(),
  });
  const imageSecretObjectToArray = (imageSecretObject): SecretEntry[] => {
    const imageSecretArray = [];
    if (_.isEmpty(imageSecretObject)) {
      return _.concat(imageSecretArray, newImageSecretEntry());
    }
    _.each(imageSecretObject, (v, k) => {
      // Decode and parse 'auth' in case 'username' and 'password' are not part of the secret.
      const decodedAuth = Base64.decode(_.get(v, 'auth', ''));
      const parsedAuth = _.isEmpty(decodedAuth) ? _.fill(Array(2), '') : _.split(decodedAuth, ':');
      imageSecretArray.push({
        entry: {
          address: k,
          username: _.get(v, 'username', parsedAuth[0]),
          password: _.get(v, 'password', parsedAuth[1]),
          email: _.get(v, 'email', ''),
          auth: _.get(v, 'auth', ''),
        },
        uid: _.get(v, 'uid', _.uniqueId()),
      });
    });
    return imageSecretArray;
  };
  const imageSecretArrayToObject = (imageSecretArray: SecretEntry[]) => {
    const imageSecretsObject = {};
    _.each(imageSecretArray, (value) => {
      imageSecretsObject[value.entry.address] = _.pick(value.entry, [
        'username',
        'password',
        'auth',
        'email',
      ]);
    });
    return imageSecretsObject;
  };

  const [secretEntriesArray, setSecretEntriesArray] = useState(
    imageSecretObjectToArray(stringData?.[AUTHS_KEY] || stringData),
  );
  const propogateEntryChange = (secretEntries: SecretEntry[]) => {
    const imageSecretObject = imageSecretArrayToObject(secretEntries);
    onChange(isDockerconfigjson ? { [AUTHS_KEY]: imageSecretObject } : imageSecretObject);
  };

  useEffect(() => {
    propogateEntryChange(secretEntriesArray);
  }, [secretEntriesArray]);

  const onDataChanged = (updatedEntry: Entry, entryIndex: number) => {
    const updatedEntryData = {
      uid: secretEntriesArray[entryIndex].uid,
      entry: updatedEntry,
    };
    const updatedSecretEntriesArray = [...secretEntriesArray];
    updatedSecretEntriesArray[entryIndex] = updatedEntryData;
    setSecretEntriesArray(updatedSecretEntriesArray);
  };

  const removeEntry = (entryIndex: number) => {
    const updatedSecretEntriesArray = [...secretEntriesArray];
    updatedSecretEntriesArray.splice(entryIndex, 1);
    setSecretEntriesArray(updatedSecretEntriesArray);
  };

  const addEntry = () => {
    setSecretEntriesArray(_.concat(secretEntriesArray, newImageSecretEntry()));
  };

  return (
    <>
      {secretEntriesArray.map((entryData, index) => (
        <div className="co-add-remove-form__entry" key={entryData.uid}>
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
            address={entryData.entry.address}
            email={entryData.entry.email}
            password={entryData.entry.password}
            username={entryData.entry.username}
            onChange={onDataChanged}
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

type Entry = {
  address: string;
  username: string;
  password: string;
  email: string;
  auth: string;
};

type SecretEntry = {
  entry: Entry;
  uid: string;
};

type PullSecretCredentialsFormProps = {
  onChange: (secretData: PullSecretData) => void;
  stringData: PullSecretData;
};
