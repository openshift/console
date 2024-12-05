import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput } from './DropableFileInput';
import { KeyValueEntry } from './types';

export const KeyValueEntryForm: React.FC<KeyValueEntryFormProps> = ({
  index,
  onChange,
  ...entry
}) => {
  const { t } = useTranslation();
  const onValueChange = (entryValue, isBinary) => {
    onChange({ ...entry, entryValue, isBinary }, index);
  };

  const onKeyChange = (event) => {
    const entryKey = event.target.value;
    onChange({ ...entry, entryKey }, index);
  };

  const { entryKey, entryValue, isBinary } = entry;
  return (
    <div className="co-create-generic-secret__form">
      <div className="form-group">
        <label className="control-label co-required" htmlFor={`${index}-key`}>
          {t('public~Key')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id={`${index}-key`}
            type="text"
            name="key"
            onChange={onKeyChange}
            value={entryKey || ''}
            data-test="secret-key"
            required
          />
        </div>
      </div>
      <div className="form-group">
        <div>
          <DroppableFileInput
            onChange={onValueChange}
            inputFileData={entryValue || ''}
            id={`${index}-value`}
            label={t('public~Value')}
            inputFieldHelpText={t(
              'public~Drag and drop file with your value here or browse to upload it.',
            )}
            inputFileIsBinary={isBinary}
          />
        </div>
      </div>
    </div>
  );
};

type KeyValueEntryFormProps = {
  entryKey: string; // can't use React reserved prop "key"
  entryValue: string;
  index: number;
  onChange: (entry: KeyValueEntry, index: number) => void;
  isBinary?: boolean;
};
