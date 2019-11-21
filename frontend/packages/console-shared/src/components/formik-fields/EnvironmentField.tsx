import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { EnvironmentPage } from '@console/internal/components/environment';
import { FormGroup } from '@patternfly/react-core';
import { EnvironmentFieldProps, NameValuePair, NameValueFromPair } from './field-types';
import { getFieldId } from './field-utils';

const EnvironmentField: React.FC<EnvironmentFieldProps> = ({
  label,
  helpText,
  required,
  ...props
}) => {
  const { setFieldValue } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'env-input');
  return (
    <FormGroup fieldId={fieldId} label={label} helperText={helpText} isRequired={required}>
      <EnvironmentPage
        obj={props.obj}
        envPath={props.envPath}
        readOnly={false}
        onChange={(obj: (NameValuePair | NameValueFromPair)[]) => setFieldValue(props.name, obj)}
        addConfigMapSecret
        useLoadingInline
      />
    </FormGroup>
  );
};

export default EnvironmentField;
