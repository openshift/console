import * as React from 'react';
import { FormSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLimitField } from '@console/shared';

const TimeoutSection: React.FC = () => {
  const { t } = useTranslation();

  const TimeoutUnits = {
    s: t('console-app~Seconds'),
    m: t('console-app~Minutes'),
    h: t('console-app~Hours'),
    ms: t('console-app~Milliseconds'),
  };

  return (
    <FormSection>
      <ResourceLimitField
        name="advancedOptions.timeout.limit"
        label={t('console-app~Timeout')}
        unitName="advancedOptions.timeout.unit"
        unitOptions={TimeoutUnits}
        helpText={t('console-app~Set timeout for the terminal.')}
      />
    </FormSection>
  );
};

export default TimeoutSection;
