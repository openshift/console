import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NumberSpinnerField } from '@console/shared/src/components/formik-fields/NumberSpinnerField';

const KafkaChannelSection: FC = () => {
  const { t } = useTranslation('knative-plugin');
  return (
    <FormSection extraMargin>
      <NumberSpinnerField
        name="formData.data.kafkachannel.numPartitions"
        label={t('Number of Partitions')}
        helpText={t('The number of partitions of a Kafka topic. By default is, set to 1.')}
      />
      <NumberSpinnerField
        name="formData.data.kafkachannel.replicationFactor"
        label={t('Replication factor')}
        helpText={t('The Replication factor of a Kafka topic. By default is, set to 1.')}
      />
    </FormSection>
  );
};

export default KafkaChannelSection;
