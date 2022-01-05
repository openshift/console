import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { FormikValues, useFormikContext, useField } from 'formik';
import { SelectorInput } from '@console/internal/components/utils';
import { FieldProps } from './field-types';
import { getFieldId } from './field-utils';

interface SelectorInputFieldProps extends FieldProps {
  placeholder?: string;
}

/**
 * Formik field wrapper around `SelectorInput` which renders a "tag editor" implemented with `react-tagsinput`.
 *
 * Values are saved as string dictionary (Record<string, string>).
 */
const SelectorInputField: React.FC<SelectorInputFieldProps> = ({
  name,
  label,
  helpText,
  required,
  dataTest,
  ...otherProps
}) => {
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [{ value }] = useField<string>(name);

  const fieldId = getFieldId(name, 'selector');
  const tags = SelectorInput.arrayify(value || '');
  const onChange = (newValue: string[]) => {
    setFieldValue(name, SelectorInput.objectify(newValue), false);
    setFieldTouched(name, true, true);
  };

  return (
    <FormGroup fieldId={fieldId} label={label} helperText={helpText} isRequired={required}>
      <SelectorInput
        onChange={onChange}
        tags={tags}
        inputProps={{ id: fieldId, 'data-test': dataTest }}
        {...otherProps}
      />
    </FormGroup>
  );
};

export default SelectorInputField;
