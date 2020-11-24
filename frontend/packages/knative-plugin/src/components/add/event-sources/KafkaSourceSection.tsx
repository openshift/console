import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, SelectInputField, SelectInputOption } from '@console/shared';
import { TextInputTypes } from '@patternfly/react-core';
import KafkaSourceNetSection from './KafkaSourceNetSection';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getBootstrapServers } from '../../../utils/create-eventsources-utils';
import { strimziResourcesWatcher } from '../../../utils/get-knative-resources';
import { EventSources } from '../import-types';

interface KafkaSourceSectionProps {
  title: string;
  fullWidth?: boolean;
}

const KafkaSourceSection: React.FC<KafkaSourceSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation();
  const memoResources = React.useMemo(() => strimziResourcesWatcher(), []);
  const { kafkas, kafkatopics } = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(memoResources);

  const [bootstrapServers, bsPlaceholder] = React.useMemo(() => {
    let bootstrapServersOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    if (kafkas.loaded && !kafkas.loadError) {
      bootstrapServersOptions = !_.isEmpty(kafkas.data)
        ? _.map(getBootstrapServers(kafkas.data), (bs) => ({
            value: bs,
            disabled: false,
          }))
        : [
            {
              value: t('knative-plugin~No Bootstrap Servers found'),
              disabled: true,
            },
          ];
      placeholder = t('knative-plugin~Add Bootstrap Servers');
    } else if (kafkas.loadError) {
      placeholder = t(
        'knative-plugin~{{loadErrorMessage}}. Try adding Bootstrap Servers manually.',
        {
          loadErrorMessage: kafkas.loadError?.message,
        },
      );
    } else {
      bootstrapServersOptions = [
        { value: t('knative-plugin~Loading Bootstrap Servers...'), disabled: true },
      ];
      placeholder = '...';
    }
    return [bootstrapServersOptions, placeholder];
  }, [kafkas.loaded, kafkas.loadError, kafkas.data, t]);

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
              value: t('knative-plugin~No Topics found'),
              disabled: true,
            },
          ];
      placeholder = t('knative-plugin~Add Topics');
    } else if (kafkatopics.loadError) {
      placeholder = t('knative-plugin~{{kafkaTopicErrorMessage}}. Try adding Topics manually.', {
        kafkaTopicErrorMessage: kafkatopics.loadError.message,
      });
    } else {
      topicsOptions = [{ value: t('knative-plugin~Loading Topics...'), disabled: true }];
      placeholder = '...';
    }
    return [topicsOptions, placeholder];
  }, [kafkatopics.loaded, kafkatopics.loadError, kafkatopics.data, t]);

  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <SelectInputField
        data-test-id="kafkasource-bootstrapservers-field"
        name={`formData.data.${EventSources.KafkaSource}.bootstrapServers`}
        label={t('knative-plugin~Bootstrap Servers')}
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
        label={t('knative-plugin~Consumer Group')}
        helpText={t('knative-plugin~A group that tracks maximum offset consumed')}
        required
      />
      <KafkaSourceNetSection />
    </FormSection>
  );
};

export default KafkaSourceSection;
