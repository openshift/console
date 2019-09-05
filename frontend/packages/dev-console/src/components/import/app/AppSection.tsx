import * as React from 'react';
import { useField } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '../../formik-fields';
import { ProjectData } from '../import-types';
import FormSection from '../section/FormSection';
import ApplicationSelector from './ApplicationSelector';

export interface AppSectionProps {
  project: ProjectData;
}

const AppSection: React.FC<AppSectionProps> = ({ project }) => {
  const [initialApplication] = useField('application.initial');
  return (
    <FormSection title="General">
      {!initialApplication.value && <ApplicationSelector namespace={project.name} />}
      <InputField
        type={TextInputTypes.text}
        data-test-id="application-form-app-name"
        name="name"
        label="Name"
        helpText="A unique name given to the component that will be used to name associated resources."
        required
      />
    </FormSection>
  );
};

export default AppSection;
