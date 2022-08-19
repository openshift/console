import * as React from 'react';
import { SelectVariant, TextInputTypes } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { FirehoseResource } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { InputField, ResourceDropdownField, SelectInputField } from '@console/shared';
import { EVENT_SINK_KAFKA_KIND } from '../../../const';
import { useBootstrapServers } from '../../../hooks';

interface KafkaSinkSectionProps {
  title: string;
  namespace: string;
  fullWidth?: boolean;
}

const KafkaSinkSection: React.FC<KafkaSinkSectionProps> = ({ title, namespace, fullWidth }) => {
  const { t } = useTranslation();
  const [bootstrapServers, bsPlaceholder] = useBootstrapServers(namespace);

  const autocompleteFilter = (text: string, item: any): boolean => fuzzy(text, item?.props?.name);

  const resources: FirehoseResource[] = [
    {
      isList: true,
      kind: SecretModel.kind,
      prop: SecretModel.id,
      namespace,
    },
  ];

  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <SelectInputField
        data-test="kafkasink-bootstrapservers-field"
        name={`formData.data.${EVENT_SINK_KAFKA_KIND}.bootstrapServers`}
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
      <InputField
        data-test="kafkasink-topic-field"
        type={TextInputTypes.text}
        name={`formData.data.${EVENT_SINK_KAFKA_KIND}.topic`}
        label={t('knative-plugin~Topic')}
        helpText={t('knative-plugin~Topic name to send events')}
        placeholder={t('knative-plugin~Enter the topic name')}
        required
      />

      <ResourceDropdownField
        data-test="kafkasink-secret-field"
        name={`formData.data.${EVENT_SINK_KAFKA_KIND}.auth.secret.ref.name`}
        resources={resources}
        dataSelector={['metadata', 'name']}
        placeholder={t('knative-plugin~Select a secret')}
        autocompleteFilter={autocompleteFilter}
        fullWidth
        showBadge
        label={t('knative-plugin~Secret')}
      />
    </FormSection>
  );
};

export default KafkaSinkSection;
