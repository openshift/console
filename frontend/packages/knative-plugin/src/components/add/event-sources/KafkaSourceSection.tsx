import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField, SelectInputField, SelectInputOption } from '@console/shared';
import { getBootstrapServers } from '../../../utils/create-eventsources-utils';
import { strimziResourcesWatcher } from '../../../utils/get-knative-resources';
import { EventSources } from '../import-types';
import KafkaSourceNetSection from './KafkaSourceNetSection';

interface KafkaSourceSectionProps {
  title: string;
  namespace: string;
  fullWidth?: boolean;
}

const KafkaSourceSection: React.FC<KafkaSourceSectionProps> = ({ title, namespace, fullWidth }) => {
  const { t } = useTranslation();
  const memoResources = React.useMemo(() => strimziResourcesWatcher(namespace), [namespace]);
  const { kafkas, kafkatopics, kafkaconnections } = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(memoResources);

  const [bootstrapServers, bsPlaceholder] = React.useMemo(() => {
    let bootstrapServersOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    const isKafkasLoaded =
      (kafkas.loaded && !kafkas.loadError) ||
      (kafkaconnections.loaded && !kafkaconnections.loadError);
    const isKafkasLoadError = !!(kafkas.loadError && kafkaconnections.loadError);
    if (isKafkasLoaded) {
      const kafkasData = [
        ...(kafkas.data ? kafkas.data : []),
        ...(kafkaconnections.data ? kafkaconnections.data : []),
      ];
      bootstrapServersOptions = !_.isEmpty(kafkasData)
        ? _.map(getBootstrapServers(kafkasData), (bs) => ({
            value: bs,
            disabled: false,
          }))
        : [
            {
              value: t('knative-plugin~No bootstrap servers found'),
              disabled: true,
            },
          ];
      placeholder = t('knative-plugin~Add bootstrap servers');
    } else if (isKafkasLoadError) {
      placeholder = t(
        'knative-plugin~{{loadErrorMessage}}. Try adding bootstrap servers manually.',
        {
          loadErrorMessage: `${kafkas.loadError.message}, ${kafkaconnections.loadError.message}`,
        },
      );
    } else {
      bootstrapServersOptions = [
        { value: t('knative-plugin~Loading bootstrap servers...'), disabled: true },
      ];
      placeholder = '...';
    }
    return [bootstrapServersOptions, placeholder];
  }, [
    kafkas.loaded,
    kafkas.loadError,
    kafkas.data,
    kafkaconnections.loaded,
    kafkaconnections.loadError,
    kafkaconnections.data,
    t,
  ]);

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
