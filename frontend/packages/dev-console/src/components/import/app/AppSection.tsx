import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, NSDropdownField } from '../../formik-fields';
import { ProjectData } from '../import-types';
import FormSection from '../section/FormSection';
import ApplicationSelector from './ApplicationSelector';

export interface AppSectionProps {
  project: ProjectData;
}

const AppSection: React.FC<AppSectionProps> = ({ project }) => {
  return (
    <FormSection title="General">
      <NSDropdownField
        data-test-id="application-form-namespace-dropdown"
        name="project.name"
        label="Project"
        disabled={!!project.name}
        fullWidth
        required
      />
      <ApplicationSelector namespace={project.name} />
      <InputField
        type={TextInputTypes.text}
        data-test-id="application-form-app-name"
        name="name"
        label="Name"
        helpText="Identifies the resources created for this application."
        required
      />
    </FormSection>
  );
};

export default AppSection;
