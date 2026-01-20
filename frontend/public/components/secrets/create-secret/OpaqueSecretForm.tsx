import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ActionGroup } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { SecretSubFormProps, OpaqueDataEntry } from './types';
import { OpaqueSecretFormEntry } from './OpaqueSecretFormEntry';
import { opaqueSecretObjectToArray, newOpaqueSecretEntry, opaqueEntriesToObject } from './utils';

export const OpaqueSecretForm: FC<SecretSubFormProps> = ({ onChange, base64StringData }) => {
  const { t } = useTranslation();
  const [opaqueDataEntries, setOpaqueDataEntries] = useState(
    opaqueSecretObjectToArray(base64StringData),
  );

  const onDataChanged = (newEntries: OpaqueDataEntry[]) => {
    setOpaqueDataEntries(newEntries);
    onChange(opaqueEntriesToObject(newEntries));
  };

  const updateEntry = (updatedEntry: OpaqueDataEntry, entryIndex: number) => {
    onDataChanged(
      opaqueDataEntries.map((entry, index) =>
        index === entryIndex ? { ...updatedEntry, uid: entry.uid } : entry,
      ),
    );
  };

  const removeEntry = (entryID: number) => {
    onDataChanged(opaqueDataEntries.filter((_, index) => index !== entryID));
  };

  const addEntry = () => {
    onDataChanged([...opaqueDataEntries, newOpaqueSecretEntry()]);
  };

  return (
    <>
      {opaqueDataEntries.map((entry, index) => {
        return (
          <>
            <OpaqueSecretFormEntry
              key={entry.uid}
              index={index}
              entry={entry}
              onChange={updateEntry}
              removeEntry={removeEntry}
              showRemoveButton={opaqueDataEntries.length > 1}
            />
          </>
        );
      })}
      <ActionGroup className="pf-v6-u-m-0">
        <Button
          onClick={() => addEntry()}
          type="button"
          variant="link"
          data-test="add-credentials-button"
          icon={<PlusCircleIcon />}
        >
          {t('public~Add key/value')}
        </Button>
      </ActionGroup>
    </>
  );
};
