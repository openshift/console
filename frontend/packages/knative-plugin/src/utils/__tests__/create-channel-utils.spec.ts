import { EVENTING_IMC_KIND } from '../../const';
import { getCreateChannelData } from '../create-channel-utils';
import { getDefaultChannelData } from './knative-serving-data';

describe('Create channel Utils', () => {
  it('should return the default data of the given reference', () => {
    const channelResource = getDefaultChannelData('core~v1beta1~KafkaChannel');
    expect(channelResource.data.kafkachannel.numPartitions).toBe(1);
    expect(channelResource.data.kafkachannel.replicationFactor).toBe(1);
  });

  it('should return the data based on form fields for the known channels', () => {
    const channelResource = getDefaultChannelData('core~v1beta1~KafkaChannel');
    const yamlIncludedResource = {
      ...channelResource,
      yamlData: JSON.stringify({
        kind: EVENTING_IMC_KIND,
        apiVersion: 'v1',
      }),
    };
    const formData = getCreateChannelData(yamlIncludedResource);
    expect(formData.kind).not.toBe(EVENTING_IMC_KIND);
  });
});
