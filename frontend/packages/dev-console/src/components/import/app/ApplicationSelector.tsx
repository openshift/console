import * as React from 'react';
import { FormGroup, ControlLabel, HelpBlock } from 'patternfly-react';
import { useFormikContext, FormikValues, useField } from 'formik';
import { InputField } from '../../formik-fields';
import { getValidationState } from '../../formik-fields/field-utils';
import ApplicationDropdown from '../../dropdown/ApplicationDropdown';

export const CREATE_APPLICATION_KEY = 'create-application-key';

export interface ApplicationSelectorProps {
  namespace?: string;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({ namespace }) => {
  const [selectedKey, { touched, error }] = useField('application.selectedKey');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const onDropdownChange = (key: string, application: string) => {
    setFieldTouched('application.selectedKey', true);
    if (key === CREATE_APPLICATION_KEY) {
      setFieldValue('application.name', '');
      setFieldValue('application.selectedKey', key);
    } else {
      setFieldValue('application.name', application);
      setFieldValue('application.selectedKey', key);
    }
  };

  return (
    <React.Fragment>
      <FormGroup
        controlId="app-selector-field"
        validationState={getValidationState(error, touched)}
      >
        <ControlLabel className="co-required">Application</ControlLabel>
        <ApplicationDropdown
          dropDownClassName="dropdown--full-width"
          menuClassName="dropdown-menu--text-wrap"
          namespace={namespace}
          actionItem={{
            actionTitle: 'Create New Application',
            actionKey: CREATE_APPLICATION_KEY,
          }}
          selectedKey={selectedKey.value}
          onChange={onDropdownChange}
        />
        {touched && error && <HelpBlock>{error}</HelpBlock>}
      </FormGroup>
      {selectedKey.value === CREATE_APPLICATION_KEY && (
        <InputField
          type="text"
          name="application.name"
          label="Application Name"
          helpText="A unique name for the application"
          required
        />
      )}
    </React.Fragment>
  );
};

export default ApplicationSelector;
