import * as React from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import { BaseFileUploadProps } from './field-types';
import { getFieldId } from './field-utils';
import { useFormikValidationFix } from '../../hooks';

const BaseFileUpload: React.FunctionComponent<BaseFileUploadProps & {
  children: (props) => React.ReactNode;
}> = ({
  filename,
  value,
  label,
  helpText,
  required,
  children,
  name,
  onChange,
  hideDefaultPreview = false,
  filenamePlaceholder = '',
  helpTextInvalid,
  validated,
  ...props
}) => {
  const [field, { touched, error }] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  const fieldId = getFieldId(name, 'fileUpload');
  useFormikValidationFix(field.value);
  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage || helpTextInvalid}
      validated={!isValid ? ValidatedOptions.error : validated}
      isRequired={required}
    >
      {children({
        ...field,
        ...props,
        filename: filename || '',
        value: value || '',
        id: fieldId,
        hideDefaultPreview,
        filenamePlaceholder,
        isRequired: { required },
        validated: !isValid ? ValidatedOptions.error : validated,
        onChange: (valueData: File, filenameData: string) => {
          onChange && onChange(valueData, filenameData);
          setFieldValue(name, filenameData, false);
          setFieldTouched(name, true, false);
        },
      })}
    </FormGroup>
  );
};

export default BaseFileUpload;
