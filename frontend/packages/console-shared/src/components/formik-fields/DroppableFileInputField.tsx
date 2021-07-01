import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { FormikValues, useField, useFormikContext } from 'formik';
import { DroppableFileInput } from '@console/internal/components/utils/file-input';
import { FieldProps } from './field-types';
import { getFieldId } from './field-utils';

const DroppableFileInputField: React.FC<FieldProps> = ({ name, label, helpText }) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(name, 'droppable-input');
  return (
    <FormGroup fieldId={fieldId}>
      <DroppableFileInput
        label={label}
        onChange={(fileData: string) => setFieldValue(name, fileData)}
        inputFileData={field.value}
        inputFieldHelpText={helpText}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
      />
    </FormGroup>
  );
};

export default DroppableFileInputField;
