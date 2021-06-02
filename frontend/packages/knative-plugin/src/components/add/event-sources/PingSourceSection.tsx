import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared';
import { EventSources } from '../import-types';

interface PingSourceSectionProps {
  title: string;
  fullWidth?: boolean;
}

const PingSourceSection: React.FC<PingSourceSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation();
  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <InputField
        type={TextInputTypes.text}
        name={`formData.data.${EventSources.PingSource}.jsonData`}
        label={t('knative-plugin~Data')}
        helpText={t('knative-plugin~The data posted to the target function')}
      />
      <InputField
        type={TextInputTypes.text}
        name={`formData.data.${EventSources.PingSource}.schedule`}
        label={t('knative-plugin~Schedule')}
        helpText={t(
          'knative-plugin~Schedule is described using the unix-cron string format (* * * * *)',
        )}
        required
      />
    </FormSection>
  );
};

export default PingSourceSection;
