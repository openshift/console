import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { NumberSpinnerField } from '@console/shared/src/components/formik-fields/NumberSpinnerField';
import FormSection from '../section/FormSection';

const ScalingSection: FC<{ name: string }> = ({ name }) => {
  const { t } = useTranslation('devconsole');
  return (
    <FormSection
      title={t('Scaling')}
      subTitle={t('Replicas are scaled manually based on CPU usage.')}
      dataTest="scaling"
    >
      <NumberSpinnerField
        name={name}
        label={t('Replicas')}
        helpText={t('The number of instances of your Image.')}
        setOutputAsIntegerFlag
      />
    </FormSection>
  );
};

export default ScalingSection;
