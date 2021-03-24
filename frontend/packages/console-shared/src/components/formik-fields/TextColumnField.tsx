import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldArray, useField } from 'formik';
import {
  Flex,
  FlexItem,
  FormGroup,
  TextInputTypes,
  Button,
  ButtonVariant,
  ButtonType,
  Tooltip,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { InputField, useFormikValidationFix } from '@console/shared';
import MultiColumnFieldFooter from './multi-column-field/MultiColumnFieldFooter';
import { getFieldId } from './field-utils';
import { FieldProps } from './field-types';

export interface TextColumnFieldProps extends FieldProps {
  required?: boolean;
  name: string;
  label: string;
  addLabel?: string;
  tooltip?: string;
  placeholder?: string;
  onChange?: (newValue: string[]) => void;
}

const TextColumnField: React.FC<TextColumnFieldProps> = ({
  required,
  name,
  label,
  addLabel,
  helpText,
  placeholder,
  isReadOnly,
  disableDeleteRow,
  tooltip,
  onChange,
}) => {
  const [field, { touched, error }] = useField<string[]>(name);
  const { t } = useTranslation();
  useFormikValidationFix(field.value);
  const rowValues = field.value ?? [];
  const fieldId = getFieldId(name, 'single-column');
  const isValid = !(touched && error);
  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => {
        return (
          <>
            <FormGroup
              fieldId={fieldId}
              label={label}
              validated={isValid ? 'default' : 'error'}
              isRequired={required}
              helperText={helpText}
            >
              {rowValues.map((v, idx) => {
                return (
                  <Flex
                    key={`${idx.toString()}`}
                    style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}
                  >
                    <FlexItem grow={{ default: 'grow' }}>
                      <InputField
                        type={TextInputTypes.text}
                        name={`${name}.${idx}`}
                        placeholder={placeholder}
                        isReadOnly={isReadOnly}
                        onChange={(e) => {
                          if (onChange) {
                            const values = [...rowValues];
                            values[idx] = e.target.value;
                            onChange(values);
                          }
                        }}
                      />
                    </FlexItem>
                    {!isReadOnly && (
                      <FlexItem>
                        <Tooltip content={tooltip || t('console-shared~Remove')}>
                          <Button
                            aria-label={tooltip || t('console-shared~Remove')}
                            variant={ButtonVariant.plain}
                            type={ButtonType.button}
                            isInline
                            isDisabled={disableDeleteRow}
                            onClick={() => {
                              arrayHelpers.remove(idx);

                              if (onChange) {
                                const values = [...rowValues];
                                values.splice(idx, 1);
                                onChange(values);
                              }
                            }}
                          >
                            <MinusCircleIcon />
                          </Button>
                        </Tooltip>
                      </FlexItem>
                    )}
                  </Flex>
                );
              })}
            </FormGroup>
            {!isReadOnly && (
              <MultiColumnFieldFooter
                addLabel={addLabel}
                onAdd={() => {
                  const newValue = '';
                  arrayHelpers.push(newValue);

                  onChange && onChange([...rowValues, newValue]);
                }}
              />
            )}
          </>
        );
      }}
    />
  );
};

export default TextColumnField;
