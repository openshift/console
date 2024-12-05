import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { SecretSubFormProps, KeyValueEntry, SecretChangeData } from './types';
import { KeyValueEntryForm } from './KeyValueEntryForm';
import { Base64StringData, SecretStringData } from '.';

const newGenericSecretEntry = () => ({
  entryKey: '',
  entryValue: '',
  uid: _.uniqueId(),
});

const arrayify = (stringData: SecretStringData, base64Data: Base64StringData): KeyValueEntry[] => {
  if (_.isEmpty(stringData)) {
    return [newGenericSecretEntry()];
  }
  return _.map(stringData, (entryValue, entryKey) => {
    return {
      uid: _.uniqueId(),
      entryKey,
      entryValue,
      isBinary: entryValue == null && Boolean(base64Data[entryKey]),
    };
  });
};

const objectify = (entries: KeyValueEntry[]): SecretChangeData => {
  return entries.reduce(
    (acc, { entryKey, entryValue, isBinary }) => {
      return {
        stringData: {
          ...acc.stringData,
          [entryKey]: isBinary ? null : entryValue,
        },
        base64StringData: {
          ...acc.base64StringData,
          [entryKey]: isBinary ? entryValue : Base64.encode(entryValue),
        },
      };
    },
    { stringData: {}, base64StringData: {} },
  );
};

export const GenericSecretForm: React.FC<SecretSubFormProps> = ({
  stringData,
  base64StringData,
  onChange,
}) => {
  const { t } = useTranslation();
  const [entries, setEntries] = React.useState(arrayify(stringData, base64StringData));

  const onDataChanged = (newEntries) => {
    setEntries((currentEntries) => {
      if (!_.isEqual(currentEntries, newEntries)) {
        onChange(objectify(newEntries));
        return newEntries;
      }
      return currentEntries;
    });
  };

  const updateEntry = (updatedEntry, atIndex) => {
    const newEntries = (entries ?? []).map((entry, i) =>
      i !== atIndex
        ? entry
        : {
            ...updatedEntry,
            uid: entry.uid,
          },
    );
    onDataChanged(newEntries);
  };

  const removeEntry = (atIndex) => {
    const newEntries = (entries ?? []).filter((_v, i) => i !== atIndex);
    onDataChanged(newEntries);
  };

  const addEntry = () => {
    onDataChanged([...entries, newGenericSecretEntry()]);
  };

  const formFields = (entries ?? []).map(({ uid, entryKey, entryValue, isBinary }, index) => (
    <div className="co-add-remove-form__entry" key={uid}>
      {_.size(entries) > 1 && (
        <div className="co-add-remove-form__link--remove-entry">
          <Button
            type="button"
            onClick={() => removeEntry(index)}
            variant="link"
            data-test="remove-entry-button"
          >
            <MinusCircleIcon className="co-icon-space-r" />
            {t('public~Remove key/value')}
          </Button>
        </div>
      )}
      <KeyValueEntryForm
        index={index}
        entryKey={entryKey}
        entryValue={entryValue}
        isBinary={isBinary}
        onChange={updateEntry}
      />
    </div>
  ));

  return (
    <>
      {formFields}
      <Button
        className="co-create-secret-form__link--add-entry pf-m-link--align-left"
        onClick={addEntry}
        type="button"
        variant="link"
        data-test="add-credentials-button"
      >
        <PlusCircleIcon className="co-icon-space-r" />
        {t('public~Add key/value')}
      </Button>
    </>
  );
};
