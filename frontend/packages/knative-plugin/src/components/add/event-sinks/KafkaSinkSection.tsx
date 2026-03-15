import type { FC } from 'react';
import { useMemo } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { InputField, ResourceDropdownField, MultiTypeaheadField } from '@console/shared';
import { EVENT_SINK_KAFKA_KIND } from '../../../const';
import { useBootstrapServers } from '../../../hooks';

interface KafkaSinkSectionProps {
  title: string;
  namespace: string;
  fullWidth?: boolean;
}

const KafkaSinkSection: FC<KafkaSinkSectionProps> = ({ title, namespace, fullWidth }) => {
  const { t } = useTranslation();
  const [bootstrapServers, bsPlaceholder] = useBootstrapServers(namespace);

  const autocompleteFilter = (text: string, item: any): boolean => fuzzy(text, item?.props?.name);

  const watchedResources = useK8sWatchResources<{ secrets: SecretKind[] }>({
    secrets: {
      isList: true,
      kind: referenceForModel(SecretModel),
      namespace,
    },
  });

  const resources = useMemo(
    () => [
      {
        data: watchedResources.secrets.data,
        loaded: watchedResources.secrets.loaded,
        loadError: watchedResources.secrets.loadError,
        kind: SecretModel.kind,
      },
    ],
    [
      watchedResources.secrets.data,
      watchedResources.secrets.loaded,
      watchedResources.secrets.loadError,
    ],
  );

  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <MultiTypeaheadField
        data-test="kafkasink-bootstrapservers-field"
        name={`formData.data.${EVENT_SINK_KAFKA_KIND}.bootstrapServers`}
        label={t('knative-plugin~Bootstrap servers')}
        ariaLabel={t('knative-plugin~Bootstrap servers')}
        options={bootstrapServers}
        placeholderText={bsPlaceholder}
        helpText={t('knative-plugin~The address of the Kafka broker')}
        isCreatable
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
