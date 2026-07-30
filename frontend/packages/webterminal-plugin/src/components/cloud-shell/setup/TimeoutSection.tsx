import type { FC } from 'react';
import { FormSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLimitField } from '@console/shared/src/components/formik-fields/ResourceLimitField';

const TimeoutSection: FC = () => {
  const { t } = useTranslation('webterminal-plugin');

  const TimeoutUnits = {
    s: t('Seconds'),
    m: t('Minutes'),
    h: t('Hours'),
    ms: t('Milliseconds'),
  };

  return (
    <FormSection>
      <ResourceLimitField
        name="advancedOptions.timeout.limit"
        label={t('Timeout')}
        unitName="advancedOptions.timeout.unit"
        unitOptions={TimeoutUnits}
        helpText={t('Set timeout for the terminal.')}
      />
    </FormSection>
  );
};

export default TimeoutSection;
