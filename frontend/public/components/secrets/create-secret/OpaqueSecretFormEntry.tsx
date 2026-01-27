import type { FC } from 'react';
import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { TextInput, Button, FormGroup, ActionGroup, FormFieldGroup } from '@patternfly/react-core';
import { DroppableFileInput } from './DropableFileInput';
import { OpaqueSecretFormEntryProps } from './types';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';

export const OpaqueSecretFormEntry: FC<OpaqueSecretFormEntryProps> = ({
  onChange,
  entry,
  index,
  removeEntry,
  showRemoveButton,
}) => {
  const { t } = useTranslation();

  const handleValueChange = (fileData: string, isBinary: boolean) => {
    const updatedEntry = {
      ...entry,
      value: isBinary ? fileData : Base64.encode(fileData),
      isBinary_: isBinary,
    };
    onChange(updatedEntry, index);
  };

  const handleKeyChange = (_event: FormEvent<HTMLInputElement>, value: string) => {
    onChange(
      {
        ...entry,
        key: value,
      },
      index,
    );
  };

  return (
    <FormFieldGroup className="pf-v6-u-display-block">
      {showRemoveButton && removeEntry && (
        <ActionGroup className="pf-v6-u-m-0 pf-v6-u-ml-auto">
          <Button
            type="button"
            onClick={() => removeEntry(index)}
            variant="link"
            data-test="remove-entry-button"
            icon={<MinusCircleIcon />}
          >
            {t('public~Remove key/value')}
          </Button>
        </ActionGroup>
      )}
      <FormGroup label={t('public~Key')} isRequired fieldId="secret-key">
        <TextInput
          id={`${entry.uid}-key`}
          type="text"
          name="key"
          value={entry.key}
          onChange={handleKeyChange}
          data-test="secret-key"
        />
      </FormGroup>
      <DroppableFileInput
        onChange={handleValueChange}
        inputFileData={Base64.decode(entry.value)}
        id={`${entry.uid}-value`}
        label={t('public~Value')}
        filenamePlaceholder={t(
          'public~Drag and drop file with your value here or browse to upload it.',
        )}
      />
    </FormFieldGroup>
  );
};
