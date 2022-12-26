import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src';
import { Resources } from '../import/import-types';
import FormSection from '../import/section/FormSection';

const PauseRolloutsSection: React.FC<{ name: string; resourceType: string }> = ({
  name,
  resourceType,
}) => {
  const { t } = useTranslation();
  const resourceLabel = resourceType === Resources.OpenShift ? 'deployment config' : 'deployment';
  return (
    <FormSection title={t('devconsole~Pause rollouts')} dataTest="pause-rollouts">
      <CheckboxField
        name={name}
        label={t('devconsole~Pause rollouts for this {{resourceLabel}}', { resourceLabel })}
        helpText={t(
          'devconsole~Pausing lets you make changes without triggering a rollout. You can resume rollouts at any time.',
        )}
      />
    </FormSection>
  );
};

export default PauseRolloutsSection;
