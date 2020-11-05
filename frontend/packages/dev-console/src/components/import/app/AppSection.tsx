import * as React from 'react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, TextAreaField } from '@console/shared';
import { ProjectData } from '../import-types';
import FormSection from '../section/FormSection';
import ApplicationSelector from './ApplicationSelector';

export interface AppSectionProps {
  project: ProjectData;
  noProjectsAvailable?: boolean;
  extraMargin?: boolean;
}

const AppSection: React.FC<AppSectionProps> = ({ project, noProjectsAvailable, extraMargin }) => {
  const [initialApplication] = useField('application.initial');
  const [formType] = useField('formType');
  const { t } = useTranslation();
  return (
    <FormSection title={t('devconsole~General')} extraMargin={extraMargin}>
      {noProjectsAvailable && (
        <>
          <InputField
            type={TextInputTypes.text}
            data-test-id="application-form-project-name"
            name="project.name"
            label={t('devconsole~Project Name')}
            helpText={t('devconsole~A unique name for the project.')}
            required
          />
          <InputField
            type={TextInputTypes.text}
            data-test-id="application-form-project-display-name"
            name="project.displayName"
            label={t('devconsole~Project Display Name')}
          />
          <TextAreaField
            data-test-id="application-form-project-description"
            name="project.description"
            label={t('devconsole~Project Description')}
          />
        </>
      )}
      {!initialApplication.value && (
        <ApplicationSelector namespace={project.name} noProjectsAvailable={noProjectsAvailable} />
      )}
      <InputField
        type={TextInputTypes.text}
        data-test-id="application-form-app-name"
        name="name"
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
