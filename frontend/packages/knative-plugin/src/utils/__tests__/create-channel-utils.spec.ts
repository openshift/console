import { referenceFor } from '@console/internal/module/k8s';
import { EventingKafkaChannelModel, EventingIMCModel } from '../../models';
import { getCreateChannelData } from '../create-channel-utils';
import { getDefaultChannelData } from './knative-serving-data';

describe('Create channel Utils', () => {
  it('should return the default data of the given reference', () => {
    const channelResource = getDefaultChannelData(referenceFor(EventingKafkaChannelModel));
    expect(channelResource.data.kafkachannel.numPartitions).toBe(1);
    expect(channelResource.data.kafkachannel.replicationFactor).toBe(1);
  });

  it('should return the data based on form fields for the known channels', () => {
    const channelResource = getDefaultChannelData(referenceFor(EventingKafkaChannelModel));
    const yamlIncludedResource = {
      ...channelResource,
      yamlData: JSON.stringify({
        kind: EventingIMCModel.kind,
        apiVersion: EventingIMCModel.apiVersion,
      }),
    };
    const formData = getCreateChannelData(yamlIncludedResource);
    expect(formData.kind).not.toBe(EventingIMCModel.kind);
  });
});
