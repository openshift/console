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
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { MultiTypeaheadField } from '@console/shared/src/components/formik-fields/MultiTypeaheadField';
import { ResourceDropdownField } from '@console/shared/src/components/formik-fields/ResourceDropdownField';
import { EVENT_SINK_KAFKA_KIND } from '../../../const';
import { useBootstrapServers } from '../../../hooks/useBootstrapServers';

interface KafkaSinkSectionProps {
  title: string;
  namespace: string;
  fullWidth?: boolean;
}

const KafkaSinkSection: FC<KafkaSinkSectionProps> = ({ title, namespace, fullWidth }) => {
  const { t } = useTranslation('knative-plugin');
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
        label={t('Bootstrap servers')}
        ariaLabel={t('Bootstrap servers')}
        options={bootstrapServers}
        placeholderText={bsPlaceholder}
        helpText={t('The address of the Kafka broker')}
        isCreatable
        required
      />
      <InputField
        data-test="kafkasink-topic-field"
        type={TextInputTypes.text}
        name={`formData.data.${EVENT_SINK_KAFKA_KIND}.topic`}
        label={t('Topic')}
        helpText={t('Topic name to send events')}
        placeholder={t('Enter the topic name')}
        required
      />

      <ResourceDropdownField
        data-test="kafkasink-secret-field"
        name={`formData.data.${EVENT_SINK_KAFKA_KIND}.auth.secret.ref.name`}
        resources={resources}
        dataSelector={['metadata', 'name']}
        placeholder={t('Select a secret')}
        autocompleteFilter={autocompleteFilter}
        fullWidth
        showBadge
        label={t('Secret')}
      />
    </FormSection>
  );
};

export default KafkaSinkSection;
