import * as React from 'react';
import { FormikValues, useField, useFormikContext } from 'formik';
import { AsyncComponent } from '@console/internal/components/utils';
import { YAMLEditorFieldProps } from './field-types';

const YAMLEditorField: React.FC<YAMLEditorFieldProps> = ({ name, onSave }) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();

  return (
    <AsyncComponent
      loader={() => import('../editor/YAMLEditor').then((c) => c.default)}
      value={field.value}
      onChange={(yaml: string) => setFieldValue(name, yaml)}
      onSave={onSave}
      showShortcuts
    />
  );
};

export default YAMLEditorField;
