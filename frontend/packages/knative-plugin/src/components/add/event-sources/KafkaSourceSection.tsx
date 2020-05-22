import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, TextColumnField } from '@console/shared';
import { TextInputTypes } from '@patternfly/react-core';
import KafkaSourceNetSection from './KafkaSourceNetSection';
import ServiceAccountDropdown from '../../dropdowns/ServiceAccountDropdown';

const KafkaSourceSection: React.FC = () => {
  const { values } = useFormikContext<FormikValues>();
  const {
    data: {
      kafkasource: { bootstrapServers, topics },
    },
  } = values;
  return (
    <FormSection title="KafkaSource" extraMargin>
      <TextColumnField
        data-test-id="kafkasource-bootstrapservers-field"
        name="data.kafkasource.bootstrapServers"
        label="BootstrapServers"
        addLabel="Add Bootstrapservers"
        helpText="The address of the Kafka broker"
        required
        disableDeleteRow={bootstrapServers?.length === 1}
      />
      <TextColumnField
        data-test-id="kafkasource-topics-field"
        name="data.kafkasource.topics"
        label="Topics"
        addLabel="Add Topics"
        helpText="Virtual groups across Kafka brokers"
        required
        disableDeleteRow={topics?.length === 1}
      />
      <InputField
        data-test-id="kafkasource-consumergroup-field"
        type={TextInputTypes.text}
        name="data.kafkasource.consumerGroup"
        label="ConsumerGroup"
        helpText="A group that tracks maximum offset consumed"
        required
      />
      <KafkaSourceNetSection />
      <ServiceAccountDropdown name="data.kafkasource.serviceAccountName" />
    </FormSection>
  );
};

export default KafkaSourceSection;
