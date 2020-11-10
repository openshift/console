import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import FormSection from '../section/FormSection';
import SourceSecretSelector from './SourceSecretSelector';

const AdvancedGitOptions: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ExpandCollapse
      textExpanded={t('devconsole~Hide Advanced Git Options')}
      textCollapsed={t('devconsole~Show Advanced Git Options')}
    >
      <FormSection>
        <InputField
          type={TextInputTypes.text}
          name="git.ref"
          label={t('devconsole~Git Reference')}
          helpText={t('devconsole~Optional branch, tag, or commit.')}
        />
        <InputField
          type={TextInputTypes.text}
          name="git.dir"
          label={t('devconsole~Context Dir')}
          helpText={t(
            'devconsole~Optional subdirectory for the application source code, used as a context directory for build.',
          )}
        />
        <SourceSecretSelector />
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedGitOptions;
