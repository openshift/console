import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues, useField } from 'formik';
import { FormGroup, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { InputField, getFieldId, useFormikValidationFix } from '@console/shared';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../../const';
import { sanitizeApplicationValue } from '../../utils/application-utils';
import ApplicationDropdown from './ApplicationDropdown';

interface ApplicationSelectorProps {
  namespace?: string;
  noProjectsAvailable?: boolean;
  subPath?: string;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({
  namespace,
  noProjectsAvailable,
  subPath,
}) => {
  const { t } = useTranslation();
  const [applicationsAvailable, setApplicationsAvailable] = React.useState(true);
  const availableApplications = React.useRef<string[]>([]);
  const projectsAvailable = !noProjectsAvailable;

  const [selectedKey, { touched, error }] = useField(
    subPath ? `${subPath}.application.selectedKey` : 'application.selectedKey',
  );
  const [nameField] = useField(subPath ? `${subPath}.application.name` : 'application.name');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [applicationExists, setApplicationExists] = React.useState<boolean>(false);
  const fieldId = getFieldId('application-name', 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(selectedKey.value);

  const onDropdownChange = (key: string, application: string) => {
    setFieldValue(selectedKey.name, key);
    setFieldTouched(selectedKey.name, true);
    setFieldValue(nameField.name, sanitizeApplicationValue(application, key));
    setFieldTouched(nameField.name, true);
    setApplicationExists(false);
  };

  const handleOnLoad = (applicationList: { [key: string]: string }) => {
    const noApplicationsAvailable = _.isEmpty(applicationList);
    setApplicationsAvailable(!noApplicationsAvailable);
    availableApplications.current = _.keys(applicationList);
    if (noApplicationsAvailable) {
      setFieldValue(selectedKey.name, '');
      setFieldValue(
        nameField.name,
        (selectedKey.value !== UNASSIGNED_KEY && nameField.value) ?? '',
      );
    }
  };

  const actionItems = [
    {
      actionTitle: t('topology~Create Application'),
      actionKey: CREATE_APPLICATION_KEY,
    },
    {
      actionTitle: t('topology~No Application group'),
      actionKey: UNASSIGNED_KEY,
    },
  ];

  const handleAppChange = (event) => {
    setApplicationExists(availableApplications.current.includes(event.target.value));
  };

  const label = t('topology~Application');
  const inputHelpText = applicationExists
    ? t('topology~Warning: the Application grouping already exists.')
    : t('topology~A unique name given to the Application grouping to label your resources.');

  return (
    <>
      {projectsAvailable && applicationsAvailable && (
        <FormGroup
          fieldId={fieldId}
          label={label}
          helperTextInvalid={errorMessage}
          validated={isValid ? 'default' : 'error'}
          helperText={t(
            'topology~Select an Application for your grouping or no Application group to not use an Application grouping.',
          )}
        >
          <ApplicationDropdown
            id={fieldId}
            ariaLabel={label}
            dropDownClassName="dropdown--full-width"
            menuClassName="dropdown-menu--text-wrap"
            namespace={namespace}
            actionItems={actionItems}
            autoSelect
            selectedKey={selectedKey.value}
            onChange={onDropdownChange}
            onLoad={handleOnLoad}
          />
        </FormGroup>
      )}
      {(!applicationsAvailable || selectedKey.value === CREATE_APPLICATION_KEY) && (
        <InputField
          type={TextInputTypes.text}
          required={selectedKey.value === CREATE_APPLICATION_KEY}
          name={nameField.name}
          label={t('topology~Application name')}
          data-test-id="application-form-app-input"
          helpText={inputHelpText}
          validated={applicationExists ? ValidatedOptions.warning : ValidatedOptions.default}
          onChange={handleAppChange}
        />
      )}
    </>
  );
};

export default ApplicationSelector;
