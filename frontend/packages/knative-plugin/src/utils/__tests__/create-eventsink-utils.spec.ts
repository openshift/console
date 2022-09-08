import { kafkaSinkMockFormData } from '../../components/add/event-sinks/__mocks__/event-kafka-sink-data';
import { EventSinkFormData } from '../../components/add/import-types';
import { getKafkaSinkResource, sanitizeKafkaSinkResource } from '../create-eventsink-utils';

describe('create-eventsink-utils', () => {
  it('expect getKafkaSinkResource to return auth if secret name is present', () => {
    const mockFormData: EventSinkFormData = {
      ...kafkaSinkMockFormData,
      data: {
        KafkaSink: {
          bootstrapServers: [],
          topic: 'kafka-topic',
          auth: {
            secret: {
              ref: {
                name: 'my-secret',
              },
            },
          },
        },
      },
    };
    const kafkaSinkdata = getKafkaSinkResource(mockFormData);
    expect(kafkaSinkdata.spec.bootstrapServers).toEqual([]);
    expect(kafkaSinkdata.spec.topic).toEqual('kafka-topic');
    expect(kafkaSinkdata.spec.auth.secret.ref.name).toEqual('my-secret');
  });

  it('expect getKafkaSinkResource to return auth as undefined if secret name is not present', () => {
    const kafkaSinkdata = getKafkaSinkResource(kafkaSinkMockFormData);
    expect(kafkaSinkdata.spec.bootstrapServers).toEqual([]);
    expect(kafkaSinkdata.spec.topic).toEqual('');
    expect(kafkaSinkdata.spec.auth).toBeUndefined();
  });

  it('expect sanitizeKafkaSinkResource to return auth if secret name is present', () => {
    const mockFormData: EventSinkFormData = {
      ...kafkaSinkMockFormData,
      data: {
        KafkaSink: {
          bootstrapServers: [],
          topic: 'kafka-topic',
          auth: {
            secret: {
              ref: {
                name: 'my-secret',
              },
            },
          },
        },
      },
    };
    const kafkaSinkFormdata = sanitizeKafkaSinkResource(mockFormData);
    expect(kafkaSinkFormdata.data.KafkaSink.bootstrapServers).toEqual([]);
    expect(kafkaSinkFormdata.data.KafkaSink.topic).toEqual('kafka-topic');
    expect(kafkaSinkFormdata.data.KafkaSink.auth.secret.ref.name).toEqual('my-secret');
  });

  it('expect sanitizeKafkaSinkResource to return auth as undefined if secret name is not present', () => {
    const kafkaSinkFormdata = sanitizeKafkaSinkResource(kafkaSinkMockFormData);
    expect(kafkaSinkFormdata.data.KafkaSink.bootstrapServers).toEqual([]);
    expect(kafkaSinkFormdata.data.KafkaSink.topic).toEqual('');
    expect(kafkaSinkFormdata.data.KafkaSink.auth).toBeUndefined();
  });
});
