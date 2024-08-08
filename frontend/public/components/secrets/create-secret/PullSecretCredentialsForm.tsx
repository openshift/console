import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import {
  AUTHS_KEY,
  PullSecretCredentialEntry,
  SecretChangeData,
  SecretStringData,
  SecretType,
} from '.';
import { usePullSecretCredentialEntries } from './usePullSecretCredentialEntries';

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
  stringData,
  onError,
  secretType,
  onFormDisable,
}) => {
  const { t } = useTranslation();
  const [entries, setEntries] = usePullSecretCredentialEntries(
    secretType,
    stringData,
    onChange,
    onError,
  );

  const isDockerconfigjson = React.useMemo(() => {
    return stringData || !!stringData[AUTHS_KEY];
  }, [stringData]);

  const updateEntry = (updatedEntry, entryIndex: number) => {
    const updatedSecretEntriesArray = entries.map((entry, index) =>
      index === entryIndex ? { uid: entry.uid, ...updatedEntry } : entry,
    );
    setEntries(updatedSecretEntriesArray);
    const secretData = isDockerconfigjson ? { [AUTHS_KEY]: entries } : entries;
    const newDataKey = isDockerconfigjson ? '.dockerconfigjson' : '.dockercfg';
    if (!_.isError(secretData)) {
      onFormDisable(false);
    }
    onChange({
      stringData: {
        [newDataKey]: JSON.stringify(secretData),
      },
    });
  };

  const removeEntry = (entryIndex: number) => {
    const updatedSecretEntriesArray = entries.filter((value, index) => index !== entryIndex);
    setEntries(updatedSecretEntriesArray);
  };

  const addEntry = () => {
    const updatedSecretsEntriesArray = [...entries, newImageSecretEntry()];
    setEntries(updatedSecretsEntriesArray);
  };

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

export type PullSecretCredential = {
  address: string;
  username: string;
  password: string;
  email: string;
  auth?: string;
  uid: string;
};

type PullSecretCredentialsFormProps = {
  onChange: (stringData: SecretChangeData) => void;
  stringData: SecretStringData;
  onError: (error: any) => void;
  secretType: SecretType;
  onFormDisable?: (disable: boolean) => void;
};
