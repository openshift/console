import * as React from 'react';
import { FormGroup } from 'patternfly-react';
import { FormikValues, useField, useFormikContext } from 'formik';
import { DroppableFileInput } from '@console/internal/components/utils/file-input';
import { InputFieldProps } from './field-types';

const DroppableFileInputField: React.FC<InputFieldProps> = ({ name, label, helpText }) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  return (
    <FormGroup controlId={`${name}-field`}>
      <DroppableFileInput
        label={label}
        onChange={(fileData: string) => setFieldValue(name, fileData)}
        inputFileData={field.value}
        inputFieldHelpText={helpText}
      />
    </FormGroup>
  );
};

export default DroppableFileInputField;
