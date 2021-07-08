import * as React from 'react';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NumberSpinnerField } from '@console/shared';

const KafkaChannelSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FormSection extraMargin>
      <NumberSpinnerField
        name="data.kafkachannel.numPartitions"
        label={t('knative-plugin~Number of Partitions')}
        helpText={t(
          'knative-plugin~The number of partitions of a Kafka topic. By default is, set to 1.',
        )}
      />
      <NumberSpinnerField
        name="data.kafkachannel.replicationFactor"
        label={t('knative-plugin~Replication factor')}
        helpText={t(
          'knative-plugin~The Replication factor of a Kafka topic. By default is, set to 1.',
        )}
      />
    </FormSection>
  );
};

export default KafkaChannelSection;
