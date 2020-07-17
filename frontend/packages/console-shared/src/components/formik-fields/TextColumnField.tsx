import * as React from 'react';
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
}) => {
  const [field, { touched, error }] = useField<string[]>(name);
  useFormikValidationFix(field.value);
  const rowValues = field.value ?? [''];
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
                      />
                    </FlexItem>
                    {!isReadOnly && (
                      <FlexItem>
                        <Tooltip content={tooltip || 'Remove'}>
                          <Button
                            aria-label={tooltip || 'Remove'}
                            variant={ButtonVariant.plain}
                            type={ButtonType.button}
                            isInline
                            isDisabled={disableDeleteRow}
                            onClick={() => {
                              arrayHelpers.remove(idx);
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
                  arrayHelpers.push('');
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
