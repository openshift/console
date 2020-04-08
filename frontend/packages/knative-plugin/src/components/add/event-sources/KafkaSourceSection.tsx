import * as React from 'react';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared';
import { TextInputTypes } from '@patternfly/react-core';
import KafkaSourceNetSection from './KafkaSourceNetSection';
import ServiceAccountDropdown from '../../dropdowns/ServiceAccountDropdown';

const KafkaSourceSection: React.FC = () => {
  return (
    <FormSection title="KafkaSource" extraMargin>
      <InputField
        data-test-id="kafkasource-bootstrapservers-field"
        type={TextInputTypes.text}
        name="data.kafkasource.bootstrapServers"
        label="BootstrapServers"
        required
      />
      <InputField
        data-test-id="kafkasource-topics-field"
        type={TextInputTypes.text}
        name="data.kafkasource.topics"
        label="Topics"
        required
      />
      <InputField
        data-test-id="kafkasource-consumergoup-field"
        type={TextInputTypes.text}
        name="data.kafkasource.consumerGroup"
        label="ConsumerGroup"
        required
      />
      <KafkaSourceNetSection />
      <ServiceAccountDropdown name="data.kafkasource.serviceAccountName" />
    </FormSection>
  );
};

export default KafkaSourceSection;
