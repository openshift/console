import * as React from 'react';
import {
  Flex,
  FlexItem,
  Button,
  FormGroup,
  TextInputTypes,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, FormikValues, useField, useFormikContext } from 'formik';
import { get, uniqueId } from 'lodash';
import { useTranslation } from 'react-i18next';
import { DroppableFileInputField, InputField, useFormikValidationFix } from '@console/shared/src';
import { FieldProps } from '../field-types';
import { getFieldId } from '../field-utils';

import './KeyValueFileInputField.scss';

type KeyValueEntry = {
  key: string;
  value: string;
};

type KeyValueEntryFormProps = {
  label?: string;
  helpText?: string;
  disableRemoveAction?: boolean;
  entries: KeyValueEntry[];
  onChange?: (value: string, keyIndex: string) => void;
};

const KeyValueFileInputField: React.FC<KeyValueEntryFormProps & FieldProps> = ({
  name,
  label = '',
  helpText = '',
  disableRemoveAction = false,
  entries = [{ key: '', value: '' }],
  onChange,
}) => {
  const [field] = useField<KeyValueEntry[]>(name);
  const { t } = useTranslation();
  const { values } = useFormikContext<FormikValues>();
  const rowValues = field.value ?? entries;
  const fieldId = getFieldId(name, 'key-value--input');
  const fieldValues = get(values, name, rowValues);
  const [uniqId, setUniqId] = React.useState(uniqueId());
  useFormikValidationFix(field.value);

  return (
    <FieldArray
      key={`${name}-${values.formReloadCount}`}
      name={name}
      render={(arrayHelpers) => (
        <FormGroup fieldId={fieldId} label={label}>
          {fieldValues?.map((v, idx) => {
            return (
              <Flex
                className="key-value--wrapper"
                data-test={'key-value-pair'}
                key={`${idx.toString()}-${uniqId}`}
                direction={{ default: 'column' }}
              >
                {!disableRemoveAction && (
                  <FlexItem className="key-value--remove-button">
                    <Button
                      icon={<MinusCircleIcon className="co-icon-space-r" />}
                      type="button"
                      data-test="remove-key-value-button"
                      onClick={() => {
                        setUniqId(uniqueId());
                        arrayHelpers.remove(idx);
                      }}
                      variant="link"
                    >
                      {t('console-shared~Remove key/value')}
                    </Button>
                  </FlexItem>
                )}

                <FlexItem>
                  <InputField
                    data-test={`key-${idx.toString()}`}
                    type={TextInputTypes.text}
                    name={`${name}.${idx.toString()}.key`}
                    label={t('console-shared~Key')}
                    required
                  />
                </FlexItem>
                <FlexItem>
                  <DroppableFileInputField
                    data-test={`value-${idx.toString()}`}
                    name={`${name}.${idx.toString()}.value`}
                    label={t('console-shared~Value')}
                    helpText={t(
                      'console-shared~Drag and drop file with your value here or browse to upload it.',
                    )}
                    onChange={(fileData: string) => {
                      onChange && onChange(fileData, `${name}.${idx.toString()}`);
                    }}
                  />
                </FlexItem>
              </Flex>
            );
          })}
          <Button
            icon={<PlusCircleIcon className="co-icon-space-r" />}
            className="pf-m-link--align-left"
            onClick={() => arrayHelpers.push({ key: '', value: '' })}
            type="button"
            data-test="add-key-value-button"
            variant="link"
          >
            {t('console-shared~Add key/value')}
          </Button>

          <FormHelperText>
            <HelperText>
              <HelperTextItem>{helpText}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      )}
    />
  );
};

export default KeyValueFileInputField;
