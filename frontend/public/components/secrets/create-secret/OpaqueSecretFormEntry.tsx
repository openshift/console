import type { FC, FormEvent } from 'react';
import { TextInput, Button, FormGroup, ActionGroup, FormFieldGroup } from '@patternfly/react-core';
import { RhUiMinusCircleIcon } from '@patternfly/react-icons';
import { Base64 } from 'js-base64';
import { useTranslation } from 'react-i18next';
import { DroppableFileInput } from './DropableFileInput';
import type { OpaqueSecretFormEntryProps } from './types';

export const OpaqueSecretFormEntry: FC<OpaqueSecretFormEntryProps> = ({
  onChange,
  entry,
  index,
  removeEntry,
  showRemoveButton,
}) => {
  const { t } = useTranslation('public');

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
            icon={<RhUiMinusCircleIcon />}
          >
            {t('Remove key/value')}
          </Button>
        </ActionGroup>
      )}
      <FormGroup label={t('Key')} isRequired fieldId="secret-key">
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
        inputFileData={entry.isBinary_ ? entry.value : Base64.decode(entry.value)}
        isBase64Input={entry.isBinary_}
        id={`${entry.uid}-value`}
        label={t('Value')}
        filenamePlaceholder={t('Drag and drop file with your value here or browse to upload it.')}
      />
    </FormFieldGroup>
  );
};
