import * as React from 'react';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared';
import { TextInputTypes } from '@patternfly/react-core';
import KafkaSourceNetSection from './KafkaSourceNetSection';
import ServiceAccountDropdown from './ServiceAccountDropdown';

const KafkaSourceSection: React.FC = () => {
  return (
    <FormSection title="KafkaSource">
      <InputField
        data-test-id="kafkasource-bootstrapservers-field"
        type={TextInputTypes.text}
        name="data.kafkasource.spec.bootstrapServers"
        label="BootstrapServers"
        required
      />
      <InputField
        data-test-id="kafkasource-topics-field"
        type={TextInputTypes.text}
        name="data.kafkasource.spec.topics"
        label="Topics"
        required
      />
      <InputField
        data-test-id="kafkasource-consumergoup-field"
        type={TextInputTypes.text}
        name="data.kafkasource.spec.consumerGroup"
        label="ConsumerGroup"
        required
      />
      <KafkaSourceNetSection />
      <ServiceAccountDropdown name="data.kafkasource.spec.serviceAccountName" />
    </FormSection>
  );
};

export default KafkaSourceSection;
