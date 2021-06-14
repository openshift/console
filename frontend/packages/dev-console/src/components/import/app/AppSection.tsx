import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { InputField, TextAreaField } from '@console/shared';
import ApplicationSelector from '@console/topology/src/components/dropdowns/ApplicationSelector';
import { ProjectData } from '../import-types';
import FormSection from '../section/FormSection';

export interface AppSectionProps {
  project: ProjectData;
  noProjectsAvailable?: boolean;
  extraMargin?: boolean;
  subPath?: string;
  fullWidth?: boolean;
}

const AppSection: React.FC<AppSectionProps> = ({
  project,
  noProjectsAvailable,
  extraMargin,
  subPath,
  fullWidth,
}) => {
  const [initialApplication] = useField('application.initial');
  const [formType] = useField('formType');
  const { t } = useTranslation();
  return (
    <FormSection title={t('devconsole~General')} extraMargin={extraMargin} fullWidth={fullWidth}>
      {noProjectsAvailable && (
        <>
          <InputField
            type={TextInputTypes.text}
            data-test-id="application-form-project-name"
            name={subPath ? `${subPath}.project.name` : 'project.name'}
            label={t('devconsole~Project name')}
            helpText={t('devconsole~A unique name for the Project.')}
            required
          />
          <InputField
            type={TextInputTypes.text}
            data-test-id="application-form-project-display-name"
            name={subPath ? `${subPath}.project.displayName` : 'project.displayName'}
            label={t('devconsole~Project display name')}
          />
          <TextAreaField
            data-test-id="application-form-project-description"
            name={subPath ? `${subPath}.project.description` : 'project.description'}
            label={t('devconsole~Project description')}
          />
        </>
      )}
      {!initialApplication.value && (
        <ApplicationSelector
          namespace={project.name}
          noProjectsAvailable={noProjectsAvailable}
          subPath={subPath}
        />
      )}
      <InputField
        type={TextInputTypes.text}
        data-test-id="application-form-app-name"
        name={subPath ? `${subPath}.name` : 'name'}
        label={t('devconsole~Name')}
        helpText={t(
          'devconsole~A unique name given to the component that will be used to name associated resources.',
        )}
        isDisabled={formType.value && formType.value === 'edit'}
        required={!(formType.value && formType.value === 'edit')}
      />
    </FormSection>
  );
};

export default AppSection;
