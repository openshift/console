import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { EventSources } from '../import-types';

interface PingSourceSectionProps {
  title: string;
  fullWidth?: boolean;
}

const PingSourceSection: FC<PingSourceSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <InputField
        type={TextInputTypes.text}
        name={`formData.data.${EventSources.PingSource}.data`}
        label={t('Data')}
        helpText={t('The data posted to the target function')}
      />
      <InputField
        type={TextInputTypes.text}
        name={`formData.data.${EventSources.PingSource}.schedule`}
        label={t('Schedule')}
        helpText={t(
          'knative-plugin~Schedule is described using the unix-cron string format (* * * * *)',
        )}
        required
      />
    </FormSection>
  );
};

export default PingSourceSection;
