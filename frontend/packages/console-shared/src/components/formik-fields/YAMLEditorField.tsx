import * as React from 'react';
import { FormikValues, useField, useFormikContext } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { YAMLEditorFieldProps } from './field-types';
import { getFieldId } from './field-utils';
import { AsyncComponent } from '@console/internal/components/utils';
import './YAMLEditorField.scss';

const YAMLEditorField: React.FC<YAMLEditorFieldProps> = ({ name }) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(name, 'yaml-editor');

  return (
    <FormGroup fieldId={fieldId}>
      <AsyncComponent
        // eslint-disable-next-line no-underscore-dangle
        loader={() => import('@console/internal/components/edit-yaml').then((c) => c.EditYAML_)}
        obj={field.value}
        onChange={(yaml: string) => setFieldValue(name, yaml)}
        download={false}
        customClass="ocs-yaml-editor-field"
        create
        hideHeader
        genericYAML
        hideActions
      />
    </FormGroup>
  );
};

export default YAMLEditorField;
