import * as React from 'react';
import { FormikValues, useField, useFormikContext } from 'formik';
import { YAMLEditorFormikFieldProps } from 'packages/console-dynamic-plugin-sdk/src/extensions/yaml-field-types';
import YAMLEditorField from './YAMLEditorField';

const YAMLEditorFormikField: React.FC<YAMLEditorFormikFieldProps> = ({ name, ...props }) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  return (
    <YAMLEditorField
      {...props}
      onChange={(value) => setFieldValue(name, value)}
      value={field.value}
    />
  );
};

export default YAMLEditorFormikField;
