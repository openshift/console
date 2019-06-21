import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { ExpandCollapse, HelpBlock, Alert } from 'patternfly-react';
import { InputField, DropdownField } from '../../formik-fields';
import FormSection from '../section/FormSection';
import SourceSecretSelector from './SourceSecretSelector';
import { GitTypes, ProjectData } from '../import-types';
import { detectGitType } from '../import-validation-utils';

export interface GitSectionProps {
  project: ProjectData;
}

const GitSection: React.FC<GitSectionProps> = ({ project }) => {
  const { values, setValues, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const handleGitUrlBlur = () => {
    const gitType = detectGitType(values.git.url);
    const showGitType = gitType === '';
    const newValues = {
      ...values,
      git: {
        ...values.git,
        type: gitType,
        showGitType,
      },
    };
    setValues(newValues);
    setFieldTouched('git.url', true);
    setFieldTouched('git.type', showGitType);
    validateForm(newValues);
  };

  return (
    <React.Fragment>
      {values.git.secret.isNewSecret && (
        <Alert
          style={{ left: '800px', position: 'absolute', top: '20px', fontWeight: 'bold' }}
          type="success"
        >
          Secret {values.git.secret.selectedKey} is created and linked with service account builder.
        </Alert>
      )}
      <FormSection title="Git" divider>
        <InputField
          type="text"
          name="git.url"
          label="Git Repo URL"
          onBlur={handleGitUrlBlur}
          required
        />
        {values.git.showGitType && (
          <DropdownField
            name="git.type"
            label="Git Type"
            items={GitTypes}
            selectedKey={values.git.type}
            title={GitTypes[values.git.type]}
            fullWidth
            required
          />
        )}
        <ExpandCollapse
          textExpanded="Hide Advanced Git Options"
          textCollapsed="Show Advanced Git Options"
        >
          <InputField
            type="text"
            name="git.ref"
            label="Git Reference"
            helpText="Optional branch, tag, or commit."
          />
          <InputField
            type="text"
            name="git.dir"
            label="Context Dir"
            helpText="Optional subdirectory for the application source code, used as a context directory for build."
          />
          <SourceSecretSelector namespace={project.name} />
          <HelpBlock>Secret with credentials for pulling your source code.</HelpBlock>
        </ExpandCollapse>
      </FormSection>
    </React.Fragment>
  );
};

export default GitSection;
