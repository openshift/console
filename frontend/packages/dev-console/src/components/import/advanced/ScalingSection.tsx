import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NumberSpinnerField } from '@console/shared';
import FormSection from '../section/FormSection';

const ScalingSection: React.FC<{ name: string }> = ({ name }) => {
  const { t } = useTranslation();
  return (
    <FormSection
      title={t('devconsole~Scaling')}
      subTitle={t('devconsole~Replicas are scaled manually based on CPU usage.')}
      dataTest="scaling"
    >
      <NumberSpinnerField
        name={name}
        label={t('devconsole~Replicas')}
        helpText={t('devconsole~The number of instances of your Image.')}
      />
    </FormSection>
  );
};

export default ScalingSection;
