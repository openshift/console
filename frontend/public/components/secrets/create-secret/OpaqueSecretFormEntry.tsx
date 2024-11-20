import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput } from './DropableFileInput';
import { OpaqueSecretFormEntryProps } from './types';

export const OpaqueSecretFormEntry: React.FC<OpaqueSecretFormEntryProps> = ({
  onChange,
  entry,
  index,
}) => {
  const { t } = useTranslation();

  const handleValueChange = (fileData: string, isBinary: boolean) => {
    const updatedEntry = {
      ...entry,
      value: fileData,
      isBinary_: isBinary,
    };
    onChange(updatedEntry, index);
  };

  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(
      {
        ...entry,
        key: event.target.value,
      },
      index,
    );
  };

  return (
    <div className="co-create-generic-secret__form">
      <div className="form-group">
        <label className="control-label co-required" htmlFor={`${index}-key`}>
          {t('public~Key')}
        </label>
        <div>
          <span className="pf-v6-c-form-control">
            <input
              id={`${index}-key`}
              type="text"
              name="key"
              onChange={handleKeyChange}
              value={entry.key}
              data-test="secret-key"
              required
            />
          </span>
        </div>
      </div>
      <div className="form-group">
        <div>
          <DroppableFileInput
            onChange={handleValueChange}
            inputFileData={entry.value}
            id={`${index}-value`}
            label={t('public~Value')}
            inputFieldHelpText={t(
              'public~Drag and drop file with your value here or browse to upload it.',
            )}
            inputFileIsBinary={entry.isBinary_}
          />
        </div>
      </div>
    </div>
  );
};
