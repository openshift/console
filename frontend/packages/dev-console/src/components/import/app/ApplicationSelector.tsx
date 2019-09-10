import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues, useField } from 'formik';
import { FormGroup, TextInputTypes } from '@patternfly/react-core';
import { InputField } from '../../formik-fields';
import ApplicationDropdown from '../../dropdown/ApplicationDropdown';
import { getFieldId } from '../../formik-fields/field-utils';

export const CREATE_APPLICATION_KEY = '#CREATE_APPLICATION_KEY#';

export interface ApplicationSelectorProps {
  namespace?: string;
  noProjectsAvailable?: boolean;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({
  namespace,
  noProjectsAvailable,
}) => {
  const [applicationsAvailable, setApplicationsAvailable] = React.useState(true);
  const projectsAvailable = !noProjectsAvailable;

  const [selectedKey, { touched, error }] = useField('application.selectedKey');
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const fieldId = getFieldId('application-name', 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  const onDropdownChange = (key: string, application: string) => {
    setFieldTouched('application.selectedKey', true);
    if (key === CREATE_APPLICATION_KEY) {
      setFieldValue('application.name', '');
      setFieldValue('application.selectedKey', key);
    } else {
      setFieldValue('application.name', application);
      setFieldValue('application.selectedKey', key);
    }
    validateForm();
  };

  const handleOnLoad = (applicationList: { [key: string]: string }) => {
    const noApplicationsAvailable = _.isEmpty(applicationList);
    setApplicationsAvailable(!noApplicationsAvailable);
    if (noApplicationsAvailable) {
      setFieldValue('application.selectedKey', CREATE_APPLICATION_KEY);
      setFieldValue('application.name', '');
    }
  };
  return (
    <React.Fragment>
      {projectsAvailable && applicationsAvailable && (
        <FormGroup
          fieldId={fieldId}
          label="Application"
          helperTextInvalid={errorMessage}
          isValid={isValid}
        >
          <ApplicationDropdown
            dropDownClassName="dropdown--full-width"
            menuClassName="dropdown-menu--text-wrap"
            id={fieldId}
            namespace={namespace}
            actionItem={{
              actionTitle: 'Create Application',
              actionKey: CREATE_APPLICATION_KEY,
            }}
            autoSelect
            selectedKey={selectedKey.value}
            onChange={onDropdownChange}
            onLoad={handleOnLoad}
          />
        </FormGroup>
      )}
      {(noProjectsAvailable || selectedKey.value === CREATE_APPLICATION_KEY) && (
        <InputField
          type={TextInputTypes.text}
          name="application.name"
          label="Application Name"
          data-test-id="application-form-app-input"
          helpText="A unique name given to the application grouping to label your resources."
        />
      )}
    </React.Fragment>
  );
};

export default ApplicationSelector;
