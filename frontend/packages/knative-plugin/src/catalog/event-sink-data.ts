import { TFunction } from 'i18next';
import { EVENT_SINK_KAFKA_KIND } from '../const';

export const getEventSinkCatalogProviderData = (
  ref: string,
  t: TFunction,
): { description?: string; provider?: string; support?: string } =>
  ({
    [EVENT_SINK_KAFKA_KIND]: {
      description: t(
        'knative-plugin~A KafkaSink takes a CloudEvent, and sends it to an Apache Kafka Topic. Events can be specified in either Structured or Binary mode.',
      ),
      provider: 'Red Hat',
      support: t('knative-plugin~Supported'),
    },
  }[ref]);
