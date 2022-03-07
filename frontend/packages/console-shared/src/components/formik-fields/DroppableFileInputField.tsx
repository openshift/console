import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { FormikValues, useField, useFormikContext } from 'formik';
import { DroppableFileInput } from '@console/internal/components/utils/file-input';
import { DroppableFileInputFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const DroppableFileInputField: React.FC<DroppableFileInputFieldProps> = ({
  name,
  label,
  helpText,
  onChange,
}) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(name, 'droppable-input');
  return (
    <FormGroup fieldId={fieldId}>
      <DroppableFileInput
        id={fieldId}
        label={label}
        onChange={(fileData: string) => {
          setFieldValue(name, fileData);
          onChange && onChange(fileData);
        }}
        inputFileData={field.value}
        inputFieldHelpText={helpText}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
      />
    </FormGroup>
  );
};

export default DroppableFileInputField;
