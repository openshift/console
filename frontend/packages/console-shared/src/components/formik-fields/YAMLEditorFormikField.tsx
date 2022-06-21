import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { YAMLEditorFieldProps } from 'packages/console-dynamic-plugin-sdk/src';
import YAMLEditorField from './YAMLEditorField';

type YAMLEditorFormikFieldProps = Omit<YAMLEditorFieldProps, 'value' | 'onChange'> & {
  name: string;
};

const YAMLEditorFormikField: React.FC<YAMLEditorFormikFieldProps> = ({ name, ...props }) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  return (
    <YAMLEditorField
      {...props}
      onChange={(value) => setFieldValue(name, value)}
      value={values[name]}
    />
  );
};

export default YAMLEditorFormikField;
