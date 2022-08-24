import * as React from 'react';
import { SelectVariant, TextInputTypes } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField, SelectInputField, SelectInputOption } from '@console/shared';
import { useBootstrapServers } from '../../../hooks';
import { kafkaTopicsResourcesWatcher } from '../../../utils/get-knative-resources';
import { EventSources } from '../import-types';
import KafkaSourceNetSection from './KafkaSourceNetSection';

interface KafkaSourceSectionProps {
  title: string;
  namespace: string;
  fullWidth?: boolean;
}

const KafkaSourceSection: React.FC<KafkaSourceSectionProps> = ({ title, namespace, fullWidth }) => {
  const { t } = useTranslation();
  const [bootstrapServers, bsPlaceholder] = useBootstrapServers(namespace);
  const { kafkatopics } = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(kafkaTopicsResourcesWatcher());

  const [kafkaTopics, ktPlaceholder] = React.useMemo(() => {
    let topicsOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    if (kafkatopics.loaded && !kafkatopics.loadError) {
      topicsOptions = !_.isEmpty(kafkatopics.data)
        ? _.map(kafkatopics.data, (kt) => ({
            value: kt?.metadata.name,
            disabled: false,
          }))
        : [
            {
              value: t('knative-plugin~No topics found'),
              disabled: true,
            },
          ];
      placeholder = t('knative-plugin~Add topics');
    } else if (kafkatopics.loadError) {
      placeholder = t('knative-plugin~{{kafkaTopicErrorMessage}}. Try adding topics manually.', {
        kafkaTopicErrorMessage: kafkatopics.loadError.message,
      });
    } else {
      topicsOptions = [{ value: t('knative-plugin~Loading topics...'), disabled: true }];
      placeholder = '...';
    }
    return [topicsOptions, placeholder];
  }, [kafkatopics.loaded, kafkatopics.loadError, kafkatopics.data, t]);

  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <SelectInputField
        data-test-id="kafkasource-bootstrapservers-field"
        name={`formData.data.${EventSources.KafkaSource}.bootstrapServers`}
        label={t('knative-plugin~Bootstrap servers')}
        ariaLabel={t('knative-plugin~Bootstrap servers')}
        variant={SelectVariant.typeaheadMulti}
        options={bootstrapServers}
        placeholderText={bsPlaceholder}
        helpText={t('knative-plugin~The address of the Kafka broker')}
        isCreatable
        hasOnCreateOption
        required
      />
      <SelectInputField
        data-test-id="kafkasource-topics-field"
        name={`formData.data.${EventSources.KafkaSource}.topics`}
        label={t('knative-plugin~Topics')}
        ariaLabel={t('knative-plugin~Topics')}
        variant={SelectVariant.typeaheadMulti}
        options={kafkaTopics}
        placeholderText={ktPlaceholder}
        helpText={t('knative-plugin~Virtual groups across Kafka brokers')}
        isCreatable
        hasOnCreateOption
        required
      />
      <InputField
        data-test-id="kafkasource-consumergroup-field"
        type={TextInputTypes.text}
        name={`formData.data.${EventSources.KafkaSource}.consumerGroup`}
        label={t('knative-plugin~Consumer group')}
        helpText={t('knative-plugin~A group that tracks maximum offset consumed')}
        required
      />
      <KafkaSourceNetSection />
    </FormSection>
  );
};

export default KafkaSourceSection;
