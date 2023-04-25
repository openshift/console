import * as React from 'react';
import { FormSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLimitField } from '@console/shared';

const TimeoutSection: React.FC = () => {
  const { t } = useTranslation();

  const TimeoutUnits = {
    s: t('webterminal-plugin~Seconds'),
    m: t('webterminal-plugin~Minutes'),
    h: t('webterminal-plugin~Hours'),
    ms: t('webterminal-plugin~Milliseconds'),
  };

  return (
    <FormSection>
      <ResourceLimitField
        name="advancedOptions.timeout.limit"
        label={t('webterminal-plugin~Timeout')}
        unitName="advancedOptions.timeout.unit"
        unitOptions={TimeoutUnits}
        helpText={t('webterminal-plugin~Set timeout for the terminal.')}
      />
    </FormSection>
  );
};

export default TimeoutSection;
