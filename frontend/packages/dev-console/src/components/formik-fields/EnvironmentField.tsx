import * as React from 'react';
import cx from 'classnames';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup, ControlLabel, HelpBlock } from 'patternfly-react';
import { EnvironmentPage } from '@console/internal/components/environment';
import { EnvironmentFieldProps, NameValuePair, NameValueFromPair } from './field-types';

const EnvironmentField: React.FC<EnvironmentFieldProps> = ({ label, helpText, ...props }) => {
  const { setFieldValue } = useFormikContext<FormikValues>();
  return (
    <FormGroup controlId={`${props.name}-field`}>
      {label && (
        <ControlLabel className={cx({ 'co-required': props.required })}>{label}</ControlLabel>
      )}
      <EnvironmentPage
        obj={props.obj}
        envPath={props.envPath}
        readOnly={false}
        onChange={(obj: (NameValuePair | NameValueFromPair)[]) => setFieldValue(props.name, obj)}
        addConfigMapSecret
        useLoadingInline
      />
      {helpText && <HelpBlock id={`${props.name}-help`}>{helpText}</HelpBlock>}
    </FormGroup>
  );
};

export default EnvironmentField;
