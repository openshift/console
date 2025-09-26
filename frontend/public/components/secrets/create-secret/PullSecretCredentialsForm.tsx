import { useState, FCC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { PullSecretCredentialEntry } from './PullSecretCredentialEntry';
import { SecretStringData, SecretType, OnSecretChange } from './types';
import {
  arrayifyPullSecret,
  getPullSecretFileName,
  stringifyPullSecret,
  newPullSecretCredential,
} from './utils';

export const PullSecretCredentialsForm: FCC<PullSecretCredentialsFormProps> = ({
  onChange,
  stringData,
  onError,
  secretType,
}) => {
  const { t } = useTranslation();
  const pullSecretFileName = getPullSecretFileName(secretType);
  const pullSecretJSON = stringData[pullSecretFileName];
  const [entries, setEntries] = useState(arrayifyPullSecret(pullSecretJSON, onError));

  useEffect(() => {
    const newPullSecretJSON = stringifyPullSecret(entries, secretType);
    if (newPullSecretJSON && newPullSecretJSON !== pullSecretJSON) {
      onChange({ stringData: { [pullSecretFileName]: newPullSecretJSON } });
    }
  }, [entries, onChange, pullSecretFileName, pullSecretJSON, secretType]);

  const updateEntry = (updatedEntry, entryIndex: number) =>
    setEntries((currentEntries) =>
      currentEntries.map(({ uid, ...entry }, index) =>
        index === entryIndex ? { uid, ...updatedEntry } : { uid, ...entry },
      ),
    );

  const removeEntry = (entryIndex: number) =>
    setEntries((currentEntries) => currentEntries.filter((_value, index) => index !== entryIndex));

  const addEntry = () =>
    setEntries((currentEntries) => [...currentEntries, newPullSecretCredential()]);

  return (
    <>
      {entries.map(({ uid, address, email, username, password }, index) => (
        <PullSecretCredentialEntry
          key={uid}
          id={index}
          address={address}
          email={email}
          password={password}
          username={username}
          onChange={updateEntry}
          removeEntry={removeEntry}
          showRemoveButton={entries.length > 1}
        />
      ))}
      <Button
        onClick={addEntry}
        type="button"
        variant="link"
        data-test="add-credentials-button"
        icon={<PlusCircleIcon />}
      >
        {t('public~Add credentials')}
      </Button>
    </>
  );
};

type PullSecretCredentialsFormProps = {
  onChange: OnSecretChange;
  stringData: SecretStringData;
  onError: (error: any) => void;
  secretType: SecretType;
  onFormDisable?: (disable: boolean) => void;
};
