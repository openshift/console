import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { AUTHS_KEY, PullSecretCredentialEntry, PullSecretData } from '.';

export const PullSecretCredentialsForm: React.FC<PullSecretCredentialsFormProps> = ({
  onChange,
  pullSecretData,
}) => {
  const { t } = useTranslation();
  const isDockerconfigjson = _.isEmpty(pullSecretData) || !!pullSecretData[AUTHS_KEY];
  const newImageSecretEntry = (): PullSecretCredential => ({
    address: '',
    username: '',
    password: '',
    email: '',
    auth: '',
    uid: _.uniqueId(),
  });
  const pullSecretDataToPullSecretCrentialArray = (imageSecretObject): PullSecretCredential[] => {
    const imageSecretArray = [];
    if (_.isEmpty(imageSecretObject)) {
      return _.concat(imageSecretArray, newImageSecretEntry());
    }
    _.each(imageSecretObject, (v, k) => {
      // Decode and parse 'auth' in case 'username' and 'password' are not part of the secret.
      const decodedAuth = Base64.decode(_.get(v, 'auth', ''));
      const parsedAuth = _.isEmpty(decodedAuth) ? _.fill(Array(2), '') : _.split(decodedAuth, ':');
      imageSecretArray.push({
        address: k,
        username: _.get(v, 'username', parsedAuth[0]),
        password: _.get(v, 'password', parsedAuth[1]),
        email: _.get(v, 'email', ''),
        auth: _.get(v, 'auth', ''),
        uid: _.get(v, 'uid', _.uniqueId()),
      });
    });
    return imageSecretArray;
  };
  const PullSecretCrentialArrayToPullSecretData = (imageSecretArray: PullSecretCredential[]) => {
    const imageSecretsObject = {};
    _.each(imageSecretArray, (value) => {
      imageSecretsObject[value.address] = _.pick(value, ['username', 'password', 'auth', 'email']);
    });
    return imageSecretsObject;
  };

  const secretEntriesArray = React.useMemo<PullSecretCredential[]>(() => {
    return pullSecretDataToPullSecretCrentialArray(pullSecretData?.[AUTHS_KEY] || pullSecretData);
  }, [pullSecretData]);

  const onEntriesChanged = (secretEntries: PullSecretCredential[]) => {
    const imageSecretObject = PullSecretCrentialArrayToPullSecretData(secretEntries);
    onChange(isDockerconfigjson ? { [AUTHS_KEY]: imageSecretObject } : imageSecretObject);
  };

  const updateEntry = (updatedEntry, entryIndex: number) => {
    const updatedEntryData = {
      uid: secretEntriesArray[entryIndex].uid,
      ...updatedEntry,
    };
    const updatedSecretEntriesArray = [...secretEntriesArray];
    updatedSecretEntriesArray[entryIndex] = updatedEntryData;
    onEntriesChanged(updatedSecretEntriesArray);
  };

  const removeEntry = (entryIndex: number) => {
    const updatedSecretEntriesArray = [...secretEntriesArray];
    updatedSecretEntriesArray.splice(entryIndex, 1);
    onEntriesChanged(updatedSecretEntriesArray);
  };

  const addEntry = () => {
    const updatedSecretsEntriesArray = _.concat(secretEntriesArray, newImageSecretEntry());
    onEntriesChanged(updatedSecretsEntriesArray);
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
            address={entryData.address}
            email={entryData.email}
            password={entryData.password}
            username={entryData.username}
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
