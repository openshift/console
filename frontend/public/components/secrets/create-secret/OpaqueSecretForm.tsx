import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { SecretSubFormProps, OpaqueDataEntry } from './types';
import { OpaqueSecretFormEntry } from './OpaqueSecretFormEntry';
import { opaqueSecretObjectToArray, newOpaqueSecretEntry, opaqueEntriesToObject } from './utils';
import { size, map } from 'lodash';

export const OpaqueSecretForm: React.FC<SecretSubFormProps> = ({
  onChange,
  stringData,
  base64StringData,
}) => {
  const { t } = useTranslation();
  const [opaqueDataEntries, setOpaqueDataEntries] = React.useState(
    opaqueSecretObjectToArray(stringData, base64StringData),
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

  const secretEntriesList = map(opaqueDataEntries, (entry, index) => {
    return (
      <div className="co-add-remove-form__entry" key={entry.uid}>
        {size(opaqueDataEntries) > 1 && (
          <div className="co-add-remove-form__link--remove-entry">
            <Button
              type="button"
              onClick={() => removeEntry(index)}
              variant="link"
              data-test="remove-entry-button"
              icon={<MinusCircleIcon className="co-icon-space-r" />}
            >
              {t('public~Remove key/value')}
            </Button>
          </div>
        )}
        <OpaqueSecretFormEntry index={index} entry={entry} onChange={updateEntry} />
      </div>
    );
  });
  return (
    <>
      {secretEntriesList}
      <Button
        className="co-create-secret-form__link--add-entry pf-m-link--align-left"
        onClick={() => addEntry()}
        type="button"
        variant="link"
        data-test="add-credentials-button"
        icon={<PlusCircleIcon className="co-icon-space-r" />}
      >
        {t('public~Add key/value')}
      </Button>
    </>
  );
};
