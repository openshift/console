import * as React from 'react';
import { InputField, NSDropdownField } from '../../formik-fields';
import { ProjectData } from '../import-types';
import FormSection from '../section/FormSection';
import ApplicationSelector from './ApplicationSelector';

export interface AppSectionProps {
  project: ProjectData;
}

const AppSection: React.FC<AppSectionProps> = ({ project }) => {
  return (
    <FormSection title="App" divider>
      <NSDropdownField
        name="project.name"
        label="Project"
        selectedKey={project.name}
        fullWidth
        required
      />
      <ApplicationSelector namespace={project.name} />
      <InputField
        type="text"
        name="name"
        label="Name"
        helpText="Identifies the resources created for this application."
        required
      />
    </FormSection>
  );
};

export default AppSection;
