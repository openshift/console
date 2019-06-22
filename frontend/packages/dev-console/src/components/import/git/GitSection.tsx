import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { Expandable } from '@patternfly/react-core';
import { InputField, DropdownField } from '../../formik-fields';
import FormSection from '../section/FormSection';
import { GitTypes } from '../import-types';
import { detectGitType } from '../import-validation-utils';

const GitSection: React.FC = () => {
  const [isExpanded, toggleExpandCollapse] = React.useState(false);
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

  const ontoggle: any = (event) => {
    // TODO: This can be removed when https://github.com/patternfly/patternfly-react/issues/2339 is fixed
    event.preventDefault();
    toggleExpandCollapse(!isExpanded);
  };

  return (
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
      <Expandable
        toggleText={isExpanded ? 'Hide Advanced Git Options' : 'Show Advanced Git Options'}
        onToggle={ontoggle}
        isExpanded={isExpanded}
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
      </Expandable>
    </FormSection>
  );
};

export default GitSection;
