import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import PipelineResourceDropdown from '../dropdown/PipelineResourceDropdown';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

export const CREATE_PIPELINE_RESOURCE = '#CREATE_PIPELINE_RESOURCE#';

export interface PipelineResourceDropdownFieldProps extends DropdownFieldProps {
  resourceForm: string;
  filterType?: string;
}
const PipelineResourceDropdownField: React.FC<PipelineResourceDropdownFieldProps> = ({
  label,
  helpText,
  required,
  fullWidth,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched, validateField, setFieldError } = useFormikContext<
    FormikValues
  >();
  const fieldId = getFieldId(props.name, 'pipeline-resource-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  
  const handleChange = React.useCallback(
    (value: string) => {
      console.log('field', field, value);
      setFieldValue(props.name, value);
      if (value === CREATE_PIPELINE_RESOURCE) {
        setFieldError(props.name, 'Complete the form creation');
      }
      setFieldTouched(props.name, true);
      validateField(props.name);
    },
    [field, setFieldValue, props.name, setFieldTouched, validateField, setFieldError],
  );

  return (
    <React.Fragment>
      <FormGroup
        fieldId={fieldId}
        label={label}
        helperText={helpText}
        helperTextInvalid={errorMessage}
        isValid={isValid}
        isRequired={required}
      >
        <PipelineResourceDropdown
          {...props}
          id={fieldId}
          selectedKey={field.value}
          dropDownClassName={cx({ 'dropdown--full-width': fullWidth })}
          actionItem={{
            actionTitle: 'Create New Pipeline Resource',
            actionKey: CREATE_PIPELINE_RESOURCE,
          }}
          autoselect
          onChange={handleChange}
          filterType={props.filterType}
        />
      </FormGroup>
      {field.value === CREATE_PIPELINE_RESOURCE && (
        <div style={{ padding: '10px', border: '1px black dotted', marginTop: '10px' }}>
          {props.resourceForm}
          <hr />
          <button onClick={() => setFieldValue(props.name, '')}> close</button>
        </div>
      )}
    </React.Fragment>
  );
};

export default PipelineResourceDropdownField;
