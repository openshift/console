import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { AUTHS_KEY, PullSecretCredentialEntry, PullSecretData } from '.';
import { usePullCredentialsFormSecretEntries } from './usePullCredentialsFormSecretEntries';

const newImageSecretEntry = (): PullSecretCredential => ({
  address: '',
  username: '',
  password: '',
  email: '',
  auth: '',
  uid: _.uniqueId(),
});

export const PullSecretCredentialsForm: React.FC<PullSecretCredentialsFormProps> = ({
  onChange,
  pullSecretData,
}) => {
  const { t } = useTranslation();
  const [secretEntriesArray, setSecretEntriesArray] = usePullCredentialsFormSecretEntries(
    pullSecretData?.[AUTHS_KEY] || pullSecretData,
    onChange,
  );

  const onEntriesChanged = (secretEntries: PullSecretCredential[]) => {
    setSecretEntriesArray(secretEntries);
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

export type PullSecretCredential = {
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
