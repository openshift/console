import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput } from '.';
import { KeyValueEntryFormProps, KeyValueEntryFormState } from './types';

export const OpaqueSecretFormEntry: React.FC<KeyValueEntryFormProps> = ({
  onChange,
  entry,
  id,
}) => {
  const [state, setState] = React.useState<KeyValueEntryFormState>(entry);
  const { t } = useTranslation();

  const onValueChange = (fileData, isBinary) => {
    setState((prevState) => ({
      ...prevState,
      value: fileData,
      isBinary,
    }));
  };

  const onKeyChange = (event) => {
    setState((prevState) => ({
      ...prevState,
      key: event.target.value,
    }));
  };

  React.useEffect(() => {
    onChange(state, id);
  }, [state]);

  return (
    <div className="co-create-generic-secret__form">
      <div className="form-group">
        <label className="control-label co-required" htmlFor={`${id}-key`}>
          {t('public~Key')}
        </label>
        <div>
          <input
            className="pf-v5-c-form-control"
            id={`${id}-key`}
            type="text"
            name="key"
            onChange={onKeyChange}
            value={state.key}
            data-test="secret-key"
            required
          />
        </div>
      </div>
      <div className="form-group">
        <div>
          <DroppableFileInput
            onChange={onValueChange}
            inputFileData={state.value}
            id={`${id}-value`}
            label={t('public~Value')}
            inputFieldHelpText={t(
              'public~Drag and drop file with your value here or browse to upload it.',
            )}
            inputFileIsBinary={state.isBinary}
          />
        </div>
      </div>
    </div>
  );
};
