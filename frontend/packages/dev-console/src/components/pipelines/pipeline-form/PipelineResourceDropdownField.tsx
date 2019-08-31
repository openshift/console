import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import PipelineResourceDropdown from '../../dropdown/PipelineResourceDropdown';
import PipelineResourceForm from '../pipeline-resource/PipelineResourceForm';
import { DropdownFieldProps } from '../../formik-fields/field-types';
import { getFieldId } from '../../formik-fields/field-utils';

export const CREATE_PIPELINE_RESOURCE = '#CREATE_PIPELINE_RESOURCE#';

export interface PipelineResourceDropdownFieldProps extends DropdownFieldProps {
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
  const [createMode, setCreateMode] = React.useState(false);
  const { setFieldValue, setFieldTouched, setStatus, status, values } = useFormikContext<
    FormikValues
  >();
  const fieldId = getFieldId(props.name, 'pipeline-resource-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  const handleChange = React.useCallback(
    (value: string) => {
      const dropdownValue = value;
      if (dropdownValue === CREATE_PIPELINE_RESOURCE) {
        setCreateMode(true);
        setStatus({
          subFormsOpened: status.subFormsOpened + 1,
        });
      } else {
        setFieldValue(props.name, dropdownValue);
        setFieldTouched(props.name, true);
      }
    },
    [setFieldValue, props.name, setFieldTouched, setStatus, status.subFormsOpened],
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
          namespace={values.namespace}
          dropDownClassName={cx({ 'dropdown--full-width': fullWidth })}
          actionItem={{
            actionTitle: 'Create New Pipeline Resource',
            actionKey: CREATE_PIPELINE_RESOURCE,
          }}
          autoselect
          onChange={handleChange}
          disabled={createMode}
          filterType={props.filterType}
        />
      </FormGroup>
      {createMode && (
        <div style={{ marginTop: 'var(--pf-global--spacer--sm)' }}>
          <PipelineResourceForm
            type={props.filterType}
            onClose={() => {
              setCreateMode(false);
              setStatus({ subFormsOpened: status.subFormsOpened ? status.subFormsOpened - 1 : 0 });
            }}
            onCreate={(data) => {
              setFieldValue(props.name, data.metadata.name);
              setFieldTouched(props.name, true);
              setCreateMode(false);
              setStatus({ subFormsOpened: status.subFormsOpened ? status.subFormsOpened - 1 : 0 });
            }}
          />
        </div>
      )}
    </React.Fragment>
  );
};

export default PipelineResourceDropdownField;
