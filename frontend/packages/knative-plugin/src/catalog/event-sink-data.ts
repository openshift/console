import { TFunction } from 'i18next';
import { EVENT_SINK_KAFKA_KIND } from '../const';

export const getEventSinkCatalogProviderData = (
  ref: string,
  t: TFunction,
): { description?: string; provider?: string; support?: string } =>
  ({
    [EVENT_SINK_KAFKA_KIND]: {
      description: t(
        'knative-plugin~Kafka Sink is Addressable, it receives events and send them to a Kafka topic.',
      ),
      provider: 'Red Hat',
      support: t('knative-plugin~Supported'),
    },
  }[ref]);
