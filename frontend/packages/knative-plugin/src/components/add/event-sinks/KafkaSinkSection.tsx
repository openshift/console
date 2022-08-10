import * as React from 'react';
import { SelectVariant, TextInputTypes } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { FirehoseResource } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  InputField,
  ResourceDropdownField,
  SelectInputField,
  SelectInputOption,
} from '@console/shared';
import { EVENT_SINK_KAFKA_KIND } from '../../../const';
import { getBootstrapServers } from '../../../utils/create-eventsources-utils';
import { strimziResourcesWatcher } from '../../../utils/get-knative-resources';

interface KafkaSinkSectionProps {
  title: string;
  namespace: string;
  fullWidth?: boolean;
}

const KafkaSinkSection: React.FC<KafkaSinkSectionProps> = ({ title, namespace, fullWidth }) => {
  const { t } = useTranslation();
  const memoResources = React.useMemo(() => strimziResourcesWatcher(namespace), [namespace]);
  const { kafkas, kafkaconnections } = useK8sWatchResources<{
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
