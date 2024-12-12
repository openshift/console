import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { PullSecretCredentialEntry } from './PullSecretCredentialEntry';
import { SecretStringData, SecretType, OnSecretChange } from './types';
import {
  arrayifyPullSecret,
  getPullSecretFileName,
  stringifyPullSecret,
  newPullSecretCredential,
} from './utils';

export const PullSecretCredentialsForm: React.FC<PullSecretCredentialsFormProps> = ({
  onChange,
  stringData,
  onError,
  secretType,
}) => {
  const { t } = useTranslation();
  const pullSecretFileName = getPullSecretFileName(secretType);
  const pullSecretJSON = stringData[pullSecretFileName];
  const [entries, setEntries] = React.useState(arrayifyPullSecret(pullSecretJSON, onError));

  React.useEffect(() => {
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
        <div className="co-add-remove-form__entry" key={uid}>
          {entries.length > 1 && (
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

type PullSecretCredentialsFormProps = {
  onChange: OnSecretChange;
  stringData: SecretStringData;
  onError: (error: any) => void;
  secretType: SecretType;
  onFormDisable?: (disable: boolean) => void;
};
