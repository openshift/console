import * as React from 'react';
import * as _ from 'lodash';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, SelectInputField, SelectInputOption } from '@console/shared';
import { TextInputTypes } from '@patternfly/react-core';
import KafkaSourceNetSection from './KafkaSourceNetSection';
import ServiceAccountDropdown from '../../dropdowns/ServiceAccountDropdown';
import { KafkaModel, KafkaTopicModel } from '../../../models';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getBootstrapServers } from '../../../utils/create-eventsources-utils';

const KafkaSourceSection: React.FC = () => {
  const [bootstrapServers, setBootstrapServers] = React.useState<SelectInputOption[]>([]);
  const [bsPlaceholder, setBsPlaceholder] = React.useState<React.ReactNode>('');
  const [kafkaTopics, setKafkaTopics] = React.useState<SelectInputOption[]>([]);
  const [ktPlaceholder, setKtPlaceholder] = React.useState<React.ReactNode>('');

  const memoResources = React.useMemo(
    () => ({
      kafka: {
        isList: true,
        kind: referenceForModel(KafkaModel),
        optional: true,
      },
      kafkaTopic: {
        isList: true,
        kind: referenceForModel(KafkaTopicModel),
        optional: true,
      },
    }),
    [],
  );
  const { kafka, kafkaTopic } = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(memoResources);

  React.useEffect(() => {
    let bootstrapServersOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    if (kafka.loaded && !kafka.loadError) {
      bootstrapServersOptions = !_.isEmpty(kafka.data)
        ? _.map(getBootstrapServers(kafka.data), (bs) => ({
            value: bs,
            disabled: false,
          }))
        : [
            {
              value: 'No Bootstrapservers found',
              disabled: true,
            },
          ];
      placeholder = 'Add Bootstrapservers';
    } else if (kafka.loadError) {
      bootstrapServersOptions = [{ value: kafka.loadError?.message, disabled: true }];
      placeholder = 'Error loading Bootstrapservers';
    } else {
      bootstrapServersOptions = [{ value: 'Loading Bootstrapservers...', disabled: true }];
      placeholder = '...';
    }
    setBootstrapServers(bootstrapServersOptions);
    setBsPlaceholder(placeholder);
  }, [kafka.data, kafka.loaded, kafka.loadError]);

  React.useEffect(() => {
    let topicsOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    if (kafkaTopic.loaded && !kafkaTopic.loadError) {
      topicsOptions = !_.isEmpty(kafkaTopic.data)
        ? _.map(kafkaTopic.data, (kt) => ({
            value: kt?.metadata.name,
            disabled: false,
          }))
        : [
            {
              value: 'No Topics found',
              disabled: true,
            },
          ];
      placeholder = 'Add Topics';
    } else if (kafkaTopic.loadError) {
      topicsOptions = [{ value: kafkaTopic.loadError?.message, disabled: true }];
      placeholder = 'Error loading Topics';
    } else {
      topicsOptions = [{ value: 'Loading Topics...', disabled: true }];
      placeholder = '...';
    }
    setKafkaTopics(topicsOptions);
    setKtPlaceholder(placeholder);
  }, [kafkaTopic.data, kafkaTopic.loaded, kafkaTopic.loadError]);

  return (
    <FormSection title="KafkaSource" extraMargin>
      <SelectInputField
        data-test-id="kafkasource-bootstrapservers-field"
        name="data.kafkasource.bootstrapServers"
        label="Bootstrapservers"
        options={bootstrapServers}
        placeholderText={bsPlaceholder}
        helpText="The address of the Kafka broker"
        isCreatable
        hasOnCreateOption
        required
      />
      <SelectInputField
        data-test-id="kafkasource-topics-field"
        name="data.kafkasource.topics"
        label="Topics"
        options={kafkaTopics}
        placeholderText={ktPlaceholder}
        helpText="Virtual groups across Kafka brokers"
        isCreatable
        hasOnCreateOption
        required
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
