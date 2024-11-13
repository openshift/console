import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import * as ITOB from 'istextorbinary/edition-es2017';
import { KeyValueEntryFormState, OpaqueSecretFormEntry } from '.';
import * as _ from 'lodash';

export const OpaqueSecretForm: React.FC<OpaqueSecretFormProps> = ({ onChange, stringData }) => {
  const { t } = useTranslation();

  const newGenericSecretEntry = (): KeyValueEntryFormState => {
    return {
      key: '',
      value: '',
      uid: _.uniqueId(),
    };
  };

  const genericSecretObjectToArray = (genericSecretObject): KeyValueEntryFormState[] => {
    if (_.isEmpty(genericSecretObject)) {
      return [newGenericSecretEntry()];
    }
    return _.map(genericSecretObject, (value, key) => {
      const isBinary = ITOB.isBinary(null, value);
      return {
        uid: _.uniqueId(),
        key,
        value: isBinary ? Base64.encode(value) : value,
        isBase64: isBinary,
        isBinary,
      };
    });
  };

  const [secretEntriesArray, setSecretEntriesArray] = React.useState(
    genericSecretObjectToArray(stringData),
  );

  const genericSecretArrayToObject = (genericSecretArray) => {
    return _.reduce(
      genericSecretArray,
      (acc, entry) =>
        _.assign(acc, {
          [entry.key]:
            entry?.isBase64 || entry?.isBinary ? entry.value : Base64.encode(entry.value),
        }),
      {},
    );
  };
  const onDataChanged = (updatedEntry, entryIndex) => {
    const updatedSecretEntriesArray = secretEntriesArray;
    updatedSecretEntriesArray[entryIndex] = updatedEntry;
    setSecretEntriesArray(updatedSecretEntriesArray);
    onChange({ base64StringData: genericSecretArrayToObject(secretEntriesArray) });
  };

  const removeEntry = (entryID) => {
    const updatedSecretEntriesArray = secretEntriesArray;
    updatedSecretEntriesArray.splice(entryID, 1);
    setSecretEntriesArray(updatedSecretEntriesArray);
    onChange(genericSecretArrayToObject(secretEntriesArray));
  };

  const addEntry = () => {
    setSecretEntriesArray([...secretEntriesArray, newGenericSecretEntry()]);
    onChange(genericSecretArrayToObject(secretEntriesArray));
  };

  const secretEntriesList = _.map(secretEntriesArray, (entry, index) => {
    return (
      <div className="co-add-remove-form__entry" key={entry.uid}>
        {_.size(secretEntriesArray) > 1 && (
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
        <OpaqueSecretFormEntry index={index} entry={entry} onChange={onDataChanged} />
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
      >
        <PlusCircleIcon className="co-icon-space-r" />
        {t('public~Add key/value')}
      </Button>
    </>
  );
};

type OpaqueSecretFormProps = {
  onChange: Function;
  stringData: {
    [key: string]: string;
  };
  isCreate?: boolean;
};
