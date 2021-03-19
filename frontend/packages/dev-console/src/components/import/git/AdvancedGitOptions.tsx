import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { ExpandCollapse } from '@console/internal/components/utils';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, useDebounceCallback } from '@console/shared';
import FormSection from '../section/FormSection';
import SourceSecretSelector from './SourceSecretSelector';

const AdvancedGitOptions: React.FC = () => {
  const { setFieldValue } = useFormikContext<FormikValues>();
  const handleGitRefChange = useDebounceCallback(
    (e: React.SyntheticEvent) => setFieldValue('git.ref', (e.target as HTMLInputElement).value),
    [setFieldValue],
  );
  return (
    <ExpandCollapse
      textExpanded="Hide Advanced Git Options"
      textCollapsed="Show Advanced Git Options"
    >
      <FormSection>
        <InputField
          type={TextInputTypes.text}
          name="git.ref"
          label="Git Reference"
          helpText="Optional branch, tag, or commit."
          onChange={handleGitRefChange}
        />
        <InputField
          type={TextInputTypes.text}
          name="git.dir"
          label="Context Dir"
          helpText="Optional subdirectory for the application source code, used as a context directory for build."
        />
        <SourceSecretSelector />
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedGitOptions;
