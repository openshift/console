import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@patternfly/react-core';
import { CheckboxField } from '@console/shared/src';

const PauseRolloutsSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FormSection title={t('devconsole~Pause rollouts')}>
      <CheckboxField
        name="paused"
        label={t('devconsole~Pause rollouts for this deployment config')}
        helpText={t(
          'devconsole~Pausing lets you make changes without triggering a rollout. You can resume rollouts at any time.',
        )}
      />
      ;
    </FormSection>
  );
};

export default PauseRolloutsSection;
