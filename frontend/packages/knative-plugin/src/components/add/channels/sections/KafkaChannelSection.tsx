import * as React from 'react';
import { NumberSpinnerField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

const KafkaChannelSection: React.FC = () => (
  <FormSection extraMargin>
    <NumberSpinnerField
      name="data.kafkachannel.numPartitions"
      label="Number of Partitions"
      helpText="The number of partitions of a Kafka topic. By defatul is, set to 1."
    />
    <NumberSpinnerField
      name="data.kafkachannel.replicationFactor"
      label="Replication Factor"
      helpText="The Replication Factor of a Kafka topic. By defatul is, set to 1."
    />
  </FormSection>
);

export default KafkaChannelSection;
