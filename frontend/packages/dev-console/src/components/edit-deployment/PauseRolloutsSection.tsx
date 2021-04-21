import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src';
import FormSection from '../import/section/FormSection';

const PauseRolloutsSection: React.FC<{ name: string }> = ({ name }) => {
  const { t } = useTranslation();
  return (
    <FormSection title={t('devconsole~Pause rollouts')}>
      <CheckboxField
        name={name}
        label={t('devconsole~Pause rollouts for this deployment config')}
        helpText={t(
          'devconsole~Pausing lets you make changes without triggering a rollout. You can resume rollouts at any time.',
        )}
      />
    </FormSection>
  );
};

export default PauseRolloutsSection;
