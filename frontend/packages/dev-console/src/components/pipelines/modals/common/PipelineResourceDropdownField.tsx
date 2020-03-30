import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { DropdownFieldProps, getFieldId, useFormikValidationFix } from '@console/shared';
import PipelineResourceDropdown from '../../../dropdown/PipelineResourceDropdown';
import PipelineResourceForm from '../../pipeline-resource/PipelineResourceForm';

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
  const [isListEmpty, setIsListEmpty] = React.useState(false);
  const [prevState, setPrevState] = React.useState(field);
  const { setFieldValue, setFieldTouched, values } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'pipeline-resource-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  const setFunctions = React.useRef({ setFieldValue, setFieldTouched });

  const setDropDownValue = (value: string): void => {
    setCreateMode(false);
    setFieldValue(props.name, value);
    setFieldTouched(props.name, true);
  };

  const handleChange = React.useCallback(
    (value: string, name: string, resourcesAvailable?: boolean) => {
      setPrevState(field);
      if (value === CREATE_PIPELINE_RESOURCE) {
        setCreateMode(true);
        setFunctions.current.setFieldValue(props.name, '');
        setIsListEmpty(resourcesAvailable);
      } else {
        setFunctions.current.setFieldValue(props.name, value);
      }
      setFunctions.current.setFieldTouched(props.name, true);
    },
    [field, props.name],
  );

  useFormikValidationFix(field.value);

  return (
    <>
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
          selectedKey={createMode ? CREATE_PIPELINE_RESOURCE : field.value}
          namespace={values.namespace}
          dropDownClassName={cx({ 'dropdown--full-width': fullWidth })}
          actionItems={[
            {
              actionTitle: 'Create New Pipeline Resource',
              actionKey: CREATE_PIPELINE_RESOURCE,
            },
          ]}
          autoselect
          onChange={handleChange}
          disabled={createMode}
          filterType={props.filterType}
        />
      </FormGroup>
      {createMode && (
        <div style={{ marginTop: 'var(--pf-global--spacer--sm)' }}>
          <PipelineResourceForm
            namespace={values.namespace}
            type={props.filterType}
            closeDisabled={isListEmpty}
            onClose={() => {
              setDropDownValue(prevState.value);
            }}
            onCreate={(data) => {
              setDropDownValue(data.metadata.name);
            }}
          />
        </div>
      )}
    </>
  );
};

export default PipelineResourceDropdownField;
