import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput } from '.';

export const OpaqueSecretFormEntry: React.FC<KeyValueEntryFormProps> = ({
  onChange,
  entry,
  index,
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
    onChange(state, index);
  }, [state]);

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
            id={`${index}-value`}
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

export type KeyValueEntryFormState = {
  isBase64?: boolean;
  isBinary?: boolean;
  key: string;
  value: string;
  uid: string;
};

export type KeyValueEntryFormProps = {
  entry: KeyValueEntryFormState;
  index: number;
  onChange: Function;
};
