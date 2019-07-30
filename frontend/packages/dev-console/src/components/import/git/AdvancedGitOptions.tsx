import * as React from 'react';
import { ExpandCollapse } from '@console/internal/components/utils';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '../../formik-fields';
import FormSection from '../section/FormSection';
import SourceSecretSelector from './SourceSecretSelector';

const AdvancedGitOptions: React.FC = () => (
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

export default AdvancedGitOptions;
